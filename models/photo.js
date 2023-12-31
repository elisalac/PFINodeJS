import Model from './model.js';
import UserModel from './user.js';
import Repository from '../models/repository.js';
import PhotoLikeModel from './photoLike.js';

export default class Photo extends Model {
    constructor() {
        super();
        this.addField('OwnerId', 'string');
        this.addField('Title', 'string');
        this.addField('Description', 'string');
        this.addField('Image', 'asset');
        this.addField('Date', 'integer');
        this.addField('Shared', 'boolean');

        this.setKey("Title");
    }

    bindExtraData(instance) {
        instance = super.bindExtraData(instance);
        let usersRepository = new Repository(new UserModel());
        instance.Owner = usersRepository.get(instance.OwnerId);
        instance.OwnerName = instance.Owner.Name;
        instance.Ownerid = instance.OwnerId;
        let photoLikesRepository = new Repository(new PhotoLikeModel());
        instance.nbLike = (photoLikesRepository.findByFilter(like => like.ImageId == instance.Id)).length;
        return instance;
    }
}