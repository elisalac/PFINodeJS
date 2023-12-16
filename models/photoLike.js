import Model from './model.js';
import UserModel from './user.js';
import Repository from '../models/repository.js';

export default class PhotoLikeModel extends Model {
    constructor() {
        super();
        this.addField('ImageId', 'string');
        this.addField('userLikeId', 'string');
    }

    bindExtraData(instance) {
        instance = super.bindExtraData(instance);
        let usersRepository = new Repository(new UserModel());
        instance.Owner = usersRepository.get(instance.userLikeId);
        instance.OwnerName = instance.Owner.Name;
        return instance;
    }
}