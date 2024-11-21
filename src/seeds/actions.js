import { Action } from "../models/index.js";

const actions = [
    { id: 'read', actionName: 'read' },
    { id: 'create', actionName: 'create' },
    { id: 'update', actionName: 'update' },
    { id: 'remove', actionName: 'remove' },
    { id: 'list', actionName: 'list' },
    { id: 'start', actionName: 'start' },
    { id: 'submit', actionName: 'submit' },
    { id: 'reopen', actionName: 'reOpen' }
];

const seedActions = async () => {
    for (const action of actions) {
        const [existingAction, created] = await Action.findOrCreate({
            where: { id: action.id },
            defaults: action,
        });
        if (created) {
            console.log(`Action ${action.actionName} inserted.`);
        } else {
            console.log(`Action ${action.actionName} already exists.`);
        }
    }
};

export default seedActions;
