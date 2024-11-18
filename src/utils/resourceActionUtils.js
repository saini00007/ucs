import { RoleResourceActionLink, Resource, Action } from '../models/index.js';

// Function to retrieve the ID of a resource by its name.
export const getResourceId = async (resourceName) => {
  try {
    const resource = await Resource.findOne({ where: { resourceName: resourceName } });
    return resource ? resource.id : null;
  } catch (error) {
    console.error(`Error retrieving resource ID for ${resourceName}:`, error);
    throw new Error('Error retrieving resource ID');
  }
};

// Function to retrieve the ID of an action by its name.
export const getActionId = async (actionName) => {
  try {
    const action = await Action.findOne({ where: { actionName: actionName } });
    return action ? action.id : null;
  } catch (error) {
    console.error(`Error retrieving action ID for ${actionName}:`, error);
    throw new Error('Error retrieving action ID');
  }
};
