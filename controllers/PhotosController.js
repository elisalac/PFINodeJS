import Authorizations from '../authorizations.js';
import Repository from '../models/repository.js';
import PhotoModel from '../models/photo.js';
//import PhotoLikeModel from '../models/photoLike.js';
import Controller from './Controller.js';

export default
    class Photos extends Controller {
    constructor(HttpContext) {
        super(HttpContext, new Repository(new PhotoModel()), Authorizations.user());
        // this.photoLikesRepository = new Repository(new PhotoLikeModel());
    }

    create(photo) {
        if (Authorizations.writeGranted(this.HttpContext, Authorizations.user())) {
            if (this.repository != null) {
                photo.Date = utilities.nowInSeconds();
                if (this.repository.model.state.isValid) {
                    this.HttpContext.response.created(photo);
                } else {
                    if (this.repository.model.state.inConflict)
                        this.HttpContext.response.conflict(this.repository.model.state.errors);
                    else
                        this.HttpContext.response.badRequest(this.repository.model.state.errors);
                }
            } else
                this.HttpContext.response.notImplemented();
        }
    }
}