const cron = require('node-cron')
const User = require('../models/user.model')

const deleteInactiveUser = async () => {
    const now = new Date();
    const users = await User.find({ isVerified: false });

    for (const user of users) {
        const diffInMs = now - user.createdAt;
        const diffInDays = diffInMs / (1000 * 60 * 60 * 24);
        
        if(diffInDays > 4) {
            await User.deleteOne({_id: user.id})
        }
    }
};
cron.schedule("0 0 */3 * * *", deleteInactiveUser) 