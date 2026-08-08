// Data-driven scene tree. SceneManager walks it; SceneRenderer builds each
// non-title/ending node's Three.js content generically from its config.
// leadsTo values are keys into this same tree — the tree is walked purely
// by which object's portal fires, no shared per-scene exit.
export const sceneTree = {
  title: {
    id: 'title',
    type: 'title',
  },

  scene_threshold: {
    id: 'scene_threshold',
    room: { seed: 12, size: [8, 8, 8] },
    objects: [
      {
        id: 'obj_phone',
        geometryType: 'phone',
        position: [1.2, 1.1, -3],
        captionText: "the phone hasn't rung in years.",
        audio: null,
        leadsTo: 'scene_garden',
      },
      {
        id: 'obj_chair',
        geometryType: 'chair',
        position: [-1.5, 0.4, -2.5],
        captionText: 'the chair still holds your shape.',
        audio: null,
        leadsTo: 'scene_attic',
      },
    ],
  },

  scene_garden: {
    id: 'scene_garden',
    room: { seed: 7, size: [8, 8, 8] },
    objects: [
      {
        id: 'obj_mug',
        geometryType: 'mug',
        position: [0, 1.1, -2],
        captionText: 'cold. it was always cold.',
        audio: null,
        leadsTo: 'ending_bloom',
      },
    ],
  },

  scene_attic: {
    id: 'scene_attic',
    room: { seed: 21, size: [8, 8, 8] },
    objects: [
      {
        id: 'obj_box',
        geometryType: 'box',
        position: [0, 0.8, -2],
        captionText: "you never opened it. you still won't.",
        audio: null,
        leadsTo: 'ending_static',
      },
    ],
  },

  ending_bloom: {
    id: 'ending_bloom',
    type: 'ending',
    endingText: 'and the anthophrenor opened, finally, into light.',
    audio: null,
  },

  ending_static: {
    id: 'ending_static',
    type: 'ending',
    endingText: 'the box stays shut. it always does.',
    audio: null,
  },
};
