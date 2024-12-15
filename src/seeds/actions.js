import { Action } from "../models/index.js";
import sequelize from "../config/db.js";

const actions = [
    { id: 'read', actionName: 'read' },
    { id: 'create', actionName: 'create' },
    { id: 'update', actionName: 'update' },
    { id: 'remove', actionName: 'remove' },
    { id: 'list', actionName: 'list' },
    { id: 'start', actionName: 'start' },
    { id: 'submit', actionName: 'submit' },
    { id: 'reopen', actionName: 'reopen' },
];

const seedActions = async () => {
    const transaction = await sequelize.transaction();
    try {
        for (const action of actions) {
            const [existingAction, created] = await Action.findOrCreate({
                where: { id: action.id },
                defaults: action,
                transaction
            });
            if (created) {
                console.log(`Action ${action.actionName} inserted.`);
            } else {
                console.log(`Action ${action.actionName} already exists.`);
            }
        }
        await transaction.commit();
    } catch (error) {
        await transaction.rollback();
        console.error("Failed to seed actions:", error);
    }
};

export default seedActions;
