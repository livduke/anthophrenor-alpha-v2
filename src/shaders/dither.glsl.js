// 4x4 Bayer ordered-dithering, sampled in screen space (gl_FragCoord)
// so the pattern is resolution-locked rather than swimming with UVs.
export const ditherChunk = /* glsl */ `
float bayerValue(vec2 fragCoord) {
  const float bayer4x4[16] = float[16](
    0.0,  8.0,  2.0, 10.0,
    12.0, 4.0, 14.0,  6.0,
    3.0, 11.0,  1.0,  9.0,
    15.0, 7.0, 13.0,  5.0
  );
  ivec2 p = ivec2(mod(fragCoord, 4.0));
  return bayer4x4[p.y * 4 + p.x] / 16.0;
}

// Quantizes a color into 'bands' tone steps using the Bayer threshold,
// giving a gritty/quantized look instead of a smooth gradient.
vec3 ditherQuantize(vec3 color, vec2 fragCoord, float bands) {
  float threshold = bayerValue(fragCoord);
  vec3 stepped = color * bands;
  vec3 fracPart = fract(stepped);
  vec3 quantized = floor(stepped) + step(threshold, fracPart);
  return quantized / bands;
}
`;
