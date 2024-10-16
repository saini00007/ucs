const permissions = {
    assessments: {
      view: [1, 2, 3, 4, 5, 6],
      create: [1, 2],
      update: [1, 2, 3],
      delete: [1],
    },
    questions: {
      view: [1, 2, 3, 4],
      create: [1, 2, 3],
      update: [1, 2, 3],
      delete: [1],
    },
    answers: {
      view: [1, 2, 3, 4, 5],
      create: [1, 2, 3, 4],
      update: [1, 2, 3],
      delete: [1],
    },
    users: {
      view: [1, 2, 3],
      create: [1, 2],
      update: [1, 2, 3],
      delete: [1],
    },
    departments: {
      view: [1, 2, 3, 4, 5],
      create: [1, 2],
      update: [1, 2],
      delete: [1],
    },
    reports: {
      view: [1, 2, 3, 4, 5, 6],
      generate: [1, 2],
      delete: [1],
    },
  };
  
  export default permissions;
  