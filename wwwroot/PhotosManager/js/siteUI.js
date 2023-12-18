
let contentScrollPosition = 0;
let sortType = "date";
let keywords = "";
let loginMessage = "";
let Email = "";
let EmailError = "";
let passwordError = "";
let currentETag = "";
let currentETagPhotos = "";
let currentViewName = "photosList";
let delayTimeOut = 200;// seconds
let intervalId = 0;
let likesChanged = false;
let photosChanged = false;
const periodicRefreshPeriod = 10;
let currentNumberOfLikes = 0;;
let currentTitle = "";
let currentLiked = false;
//let currentId = "";

let sortByOwnersCss = "menuIcon fa fa-fw mx-2";
let sortByLikesCss = "menuIcon fa fa-fw mx-2";
let sortByDateCss = "menuIcon fa fa-fw mx-2";
let ownerOnlyCss = "menuIcon fa fa-fw mx-2";

// pour la pagination
let queryString = "";
let photoContainerWidth = 370;
let photoContainerHeight = 345;
let endOfData = false;
let limit;
let HorizontalPhotosCount;
let VerticalPhotosCount;
let offset = 0;


Init_UI();
function Init_UI() {
    getViewPortPhotosRanges();
    //initTimeout(delayTimeOut, stop_Periodic_Refresh);
    initTimeout(delayTimeOut, renderExpiredSession);
    installWindowResizeHandler();
    if (API.retrieveLoggedUser())
        renderPhotos();
    else
        renderLoginForm();
}

async function start_Periodic_Refresh() {
    intervalId = setInterval(async () => {

        let loggedUser = await API.retrieveLoggedUser();

        if (loggedUser != null) {
            let etag = await API.HeadLIKES();
            let etagPhotos = await API.HeadPHOTO();

            if (etag != undefined && etagPhotos != undefined) {
                if (API.currentErrorStatus == 401) {
                    renderExpiredSession();
                }
                if (currentETag != etag) {
                    currentETag = etag;
                    if (currentViewName == "photosList") {
                        renderPhotosList(true);
                    }
                    else {
                        renderPhotoDetail(currentId);
                    }
                }
                else if (currentETagPhotos != etagPhotos) {
                    currentETagPhotos = etagPhotos
                    renderPhotosList(true);
                }
            }

        }
    },
        periodicRefreshPeriod * 100);
}
function stop_Periodic_Refresh() {
    clearInterval(intervalId); // Clear the interval
}
// pour la pagination
function getViewPortPhotosRanges() {
    // estimate the value of limit according to height of content
    VerticalPhotosCount = Math.round($("#content").innerHeight() / photoContainerHeight);
    HorizontalPhotosCount = Math.round($("#content").innerWidth() / photoContainerWidth);
    limit = (VerticalPhotosCount + 1) * HorizontalPhotosCount;
    offset = 0;
}
// pour la pagination
function installWindowResizeHandler() {
    var resizeTimer = null;
    var resizeEndTriggerDelai = 250;
    $(window).on('resize', function (e) {
        if (!resizeTimer) {
            $(window).trigger('resizestart');
        }
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function () {
            resizeTimer = null;
            $(window).trigger('resizeend');
        }, resizeEndTriggerDelai);
    }).on('resizestart', function () {
    }).on('resizeend', function () {
        if ($('#contentImage') != null) {
            getViewPortPhotosRanges();
            if (currentViewName == "photosList")
                endOfData = false;
            renderPhotosList(true);
        }
    });
}
function attachCmd() {

    $('#loginCmd').on('click', renderLoginForm);
    $('#logoutCmd').on('click', logout);
    $('#listPhotosCmd').on('click', renderPhotos);
    $('#listPhotosMenuCmd').on('click', function () {
        sortByDateCSS = "menuIcon fa fa-fw mx-2";
        sortByOwnerCSS = "menuIcon fa fa-fw mx-2";
        sortByLikeCSS = "menuIcon fa fa-fw mx-2";
        ownerOnlyCSS = "menuIcon fa fa-fw mx-2";
        queryString = "";
        renderPhotos("")

    });
    $('#editProfilMenuCmd').on('click', function(){
        saveContentScrollPosition();
        renderEditProfilForm();
    });
    $('#renderManageUsersMenuCmd').on('click', function () {
        saveContentScrollPosition();
        renderManageUsers();
    });
    $('#editProfilCmd').on('click', function () {
        saveContentScrollPosition();
        renderEditProfilForm()
    });
    $('#aboutCmd').on("click", function () {
        saveContentScrollPosition();
        renderAbout();
    });
    $('#newPhotoCmd').on("click", function () {
        saveContentScrollPosition();
        renderAddNewPhoto();
    })
    $('#sortByDateCmd').on("click", async function () {
        sortByDateCSS = "menuIcon fa fa-check mx-2";
        sortByOwnerCSS = "menuIcon fa fa-fw mx-2";
        sortByLikeCSS = "menuIcon fa fa-fw mx-2";
        ownerOnlyCSS = "menuIcon fa fa-fw mx-2";
        queryString = "?sort=Date";
        renderPhotos();
    });
    $('#sortByOwnersCmd').on("click", async function () {
        sortByDateCSS = "menuIcon fa fa-fw mx-2";
        sortByOwnerCSS = "menuIcon fa fa-check mx-2";
        sortByLikeCSS = "menuIcon fa fa-fw mx-2";
        ownerOnlyCSS = "menuIcon fa fa-fw mx-2";
        queryString = "?sort=OwnerId";
        renderPhotos();
    });
    $('#sortByLikesCmd').on("click", async function () {
        sortByDateCSS = "menuIcon fa fa-fw mx-2";
        sortByOwnerCSS = "menuIcon fa fa-fw mx-2";
        sortByLikeCSS = "menuIcon fa fa-check mx-2";
        ownerOnlyCSS = "menuIcon fa fa-fw mx-2";
        queryString = "?sort=nbLike desc";
        renderPhotos();
    });
    $('#ownerOnlyCmd').on("click", async function () {
        sortByDateCSS = "menuIcon fa fa-fw mx-2";
        sortByOwnerCSS = "menuIcon fa fa-fw mx-2";
        sortByLikeCSS = "menuIcon fa fa-fw mx-2";
        ownerOnlyCSS = "menuIcon fa fa-check mx-2";

        let currentUser = (await API.retrieveLoggedUser()).Id;
        queryString = "?OwnerId=" + currentUser;
        renderPhotos();
    });
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/// Header management
function loggedUserMenu() {
    let loggedUser = API.retrieveLoggedUser();
    if (loggedUser) {
        let icons = currentViewName == "photosList" ? `<div class="dropdown-divider"></div>
        <span class="dropdown-item" id="sortByDateCmd">
            <i class="${sortByDateCss}"></i>
            <i class="menuIcon fa fa-calendar mx-2"></i>
             Photos par date de création
        </span>
        <span class="dropdown-item" id="sortByOwnersCmd">
            <i class="${sortByOwnersCss}"></i>
            <i class="menuIcon fa fa-users mx-2"></i>
            Photos par créateur
        </span>
        <span class="dropdown-item"  id="sortByLikesCmd">
        <i class="${sortByLikesCss}"></i> 
        <i class="menuIcon fa fa-heart mx-2"></i>
            Photos les plus aimées
        </span>
        <span class="dropdown-item" id="ownerOnlyCmd">
            <i class="${ownerOnlyCss}"></i>
            <i class="menuIcon fa fa-user mx-2"></i>
            Mes photos
        </span>`: "";
        let manageUserMenu = `
            <span class="dropdown-item" id="renderManageUsersMenuCmd">
                <i class="menuIcon fas fa-user-cog mx-2"></i> Gestion des usagers
            </span>
            <div class="dropdown-divider"></div>
        `;
        return `
            ${loggedUser.isAdmin ? manageUserMenu : ""}
            <span class="dropdown-item" id="logoutCmd">
                <i class="menuIcon fa fa-sign-out mx-2"></i> Déconnexion
            </span>
            <span class="dropdown-item" id="editProfilMenuCmd">
                <i class="menuIcon fa fa-user-edit mx-2"></i> Modifier votre profil
            </span>
            <div class="dropdown-divider"></div>
            <span class="dropdown-item" id="listPhotosMenuCmd">
                <i class="menuIcon fa fa-image mx-2"></i> Liste des photos
            </span>
               ${icons}
        `;
    }
    else
        return `
            <span class="dropdown-item" id="loginCmd">
                <i class="menuIcon fa fa-sign-in mx-2"></i> Connexion
            </span>`;
}
function viewMenu(viewName) {
    if (viewName == "photosList") {
        // todo
        return "";
    }
    else
        return "";
}
function connectedUserAvatar() {
    let loggedUser = API.retrieveLoggedUser();
    if (loggedUser)
        return `
            <div class="UserAvatarSmall" userId="${loggedUser.Id}" id="editProfilCmd" style="background-image:url('${loggedUser.Avatar}')" title="${loggedUser.Name}"></div>
        `;
    return "";
}
function refreshHeader() {
    UpdateHeader(currentViewTitle, currentViewName);
}
function UpdateHeader(viewTitle, viewName) {
    currentViewTitle = viewTitle;
    currentViewName = viewName;
    $("#header").empty();
    $("#header").append(`
        <span title="Liste des photos" id="listPhotosCmd"><img src="images/PhotoCloudLogo.png" class="appLogo"></span>
        <span class="viewTitle">${viewTitle} 
            <div class="cmdIcon fa fa-plus" id="newPhotoCmd" title="Ajouter une photo"></div>
        </span>

        <div class="headerMenusContainer">
            <span>&nbsp</span> <!--filler-->
            <i title="Modifier votre profil"> ${connectedUserAvatar()} </i>         
            <div class="dropdown ms-auto dropdownLayout">
                <div data-bs-toggle="dropdown" aria-expanded="false">
                    <i class="cmdIcon fa fa-ellipsis-vertical"></i>
                </div>
                <div class="dropdown-menu noselect">
                    ${loggedUserMenu()}
                    ${viewMenu(viewName)}
                    <div class="dropdown-divider"></div>
                    <span class="dropdown-item" id="aboutCmd">
                        <i class="menuIcon fa fa-info-circle mx-2"></i> À propos...
                    </span>
                </div>
            </div>

        </div>
    `);
    if (sortType == "keywords" && viewName == "photosList") {
        $("#customHeader").show();
        $("#customHeader").empty();
        $("#customHeader").append(`
            <div class="searchContainer">
                <input type="search" class="form-control" placeholder="Recherche par mots-clés" id="keywords" value="${keywords}"/>
                <i class="cmdIcon fa fa-search" id="setSearchKeywordsCmd"></i>
            </div>
        `);
    } else {
        $("#customHeader").hide();
    }
    attachCmd();
}
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/// Actions and command
async function login(credential) {
    loginMessage = "";
    EmailError = "";
    passwordError = "";
    Email = credential.Email;
    await API.login(credential.Email, credential.Password);
    if (API.error) {
        switch (API.currentStatus) {
            case 482: passwordError = "Mot de passe incorrect"; renderLoginForm(); break;
            case 481: EmailError = "Courriel introuvable"; renderLoginForm(); break;
            case 483: loginMessage = "L'usager est déjà connecter!"; renderLoginForm(); break;
            default: renderError("Le serveur ne répond pas"); break;
        }
    } else {
        let loggedUser = API.retrieveLoggedUser();
        if (loggedUser.VerifyCode == 'verified') {
            if (!loggedUser.isBlocked)
                renderPhotos();
            else {
                loginMessage = "Votre compte a été bloqué par l'administrateur";
                logout();
            }
        }
        else
            renderVerify();
    }
}
async function logout() {
    sortByOwnersCss = "menuIcon fa fa-fw mx-2";
    sortByLikesCss = "menuIcon fa fa-fw mx-2";
    sortByDateCss = "menuIcon fa fa-fw mx-2";
    ownerOnlyCss = "menuIcon fa fa-fw mx-2";
    queryString = "";
    contentScrollPosition = 0;
    // stop_Periodic_Refresh();
    await API.logout();
    renderLoginForm();
}
function isVerified() {
    let loggedUser = API.retrieveLoggedUser();
    return loggedUser.VerifyCode == "verified";
}
async function verify(verifyCode) {
    let loggedUser = API.retrieveLoggedUser();
    if (await API.verifyEmail(loggedUser.Id, verifyCode)) {
        renderPhotos();
    } else {
        renderError("Désolé, votre code de vérification n'est pas valide...");
    }
}
async function editProfil(profil) {
    if (await API.modifyUserProfil(profil)) {
        let loggedUser = API.retrieveLoggedUser();
        if (loggedUser) {
            if (isVerified()) {
                renderPhotos();
            } else
                renderVerify();
        } else
            renderLoginForm();

    } else {
        renderError("Un problème est survenu.");
    }
}
async function createProfil(profil) {
    if (await API.register(profil)) {
        loginMessage = "Votre compte a été créé. Veuillez prendre vos courriels pour réccupérer votre code de vérification qui vous sera demandé lors de votre prochaine connexion."
        renderLoginForm();
    } else {
        renderError("Un problème est survenu.");
    }
}
async function adminDeleteAccount(userId) {
    if (await API.unsubscribeAccount(userId)) {
        renderManageUsers();
    } else {
        renderError("Un problème est survenu.");
    }
}
async function deleteProfil() {
    let loggedUser = API.retrieveLoggedUser();
    if (loggedUser) {
        if (await API.unsubscribeAccount(loggedUser.Id)) {
            loginMessage = "Votre compte a été effacé.";
            logout();
        } else
            renderError("Un problème est survenu.");
    }
}
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/// Views rendering
function showWaitingGif() {
    eraseContent();
    $("#content").append($("<div class='waitingGifcontainer'><img class='waitingGif' src='images/Loading_icon.gif' /></div>'"));
}
function eraseContent() {
    $("#content").empty();
}
function saveContentScrollPosition() {
    contentScrollPosition = $("#content")[0].scrollTop;
}
function restoreContentScrollPosition() {
    $("#content")[0].scrollTop = contentScrollPosition;
}
async function renderError(message) {
    noTimeout();
    switch (API.currentStatus) {
        case 401:
        case 403:
        case 405:
            message = "Accès refusé...Expiration de votre session. Veuillez vous reconnecter.";
            await API.logout();
            renderLoginForm();
            break;
        case 404: message = "Ressource introuvable..."; break;
        case 409: message = "Ressource conflictuelle..."; break;
        default: if (!message) message = "Un problème est survenu...";
    }
    saveContentScrollPosition();
    eraseContent();
    UpdateHeader("Problème", "error");
    $("#newPhotoCmd").hide();
    $("#content").append(
        $(`
            <div class="errorContainer">
                <b>${message}</b>
            </div>
            <hr>
            <div class="form">
                <button id="connectCmd" class="form-control btn-primary">Connexion</button>
            </div>
        `)
    );
    $('#connectCmd').on('click', renderLoginForm);
    /* pour debug
     $("#content").append(
        $(`
            <div class="errorContainer">
                <b>${message}</b>
            </div>
            <hr>
            <div class="systemErrorContainer">
                <b>Message du serveur</b> : <br>
                ${API.currentHttpError} <br>

                <b>Status Http</b> :
                ${API.currentStatus}
            </div>
        `)
    ); */
}
async function renderAbout() {
    timeout();
    saveContentScrollPosition();
    eraseContent();
    UpdateHeader("À propos...", "about");
    $("#newPhotoCmd").hide();
    $("#createContact").hide();
    $("#abort").show();
    $("#content").append(
        $(`
            <div class="aboutContainer">
                <h2>Gestionnaire de photos</h2>
                <hr>
                <p>
                    Petite application de gestion de photos multiusagers à titre de démonstration
                    d'interface utilisateur monopage réactive.
                </p>
                <p>
                    Auteur: vos noms d'équipiers
                </p>
                <p>
                    Collège Lionel-Groulx, automne 2023
                </p>
            </div>
        `))
}
async function renderPhotos() {
    timeout();
    showWaitingGif();
    UpdateHeader('Liste des photos', 'photosList')
    $("#newPhotoCmd").show();
    $("#abort").hide();
    let loggedUser = API.retrieveLoggedUser();
    if (loggedUser) {
        currentETag = await API.HeadLIKES();
        currentETagPhotos = await API.HeadPHOTO();
        start_Periodic_Refresh();
        renderPhotosList(true);
    }
    else {
        renderLoginForm();
    }
}
async function renderModifyPhoto(id) {
    eraseContent();
    let photo = await API.GetPhotosById(id);
    UpdateHeader("Modification d'une photo", "modfiyPhoto");
    checkbox = photo.Shared ? "checked" : "";
    $("#content").append(`
    <br/>
    <form class="form" id="modifyPicForm"'>
    <input type="hidden" name="Id" value="${photo.Id}" />
        <input type="hidden" name="OwnerId" value="${photo.OwnerId}" />
        <input type="hidden" name="Date" value="${photo.Date}" />
           
        <fieldset>
            <legend>Informations</legend>
            <input  type="text" 
                    class="form-control Alpha" 
                    name="Title" 
                    id="Title"
                    placeholder="Titre" 
                    value="${photo.Title}"
                    required 
                    RequireMessage = 'Veuillez entrer un titre'
                    InvalidMessage = 'Titre invalide'/>

                    <textarea
                    class="form-control Alpha"
                    name="Description"
                    id="Description"
                    placeholder="Description"
                    required
                >${photo.Description}</textarea>

            <input  type="checkbox"   
                    name="Shared" 
                    id="Share" 
                    ${checkbox}
                    />

            <label for="Share">Partagée</label>

        </fieldset>
        <fieldset>
            <legend>Image</legend>
            <div class='imageUploader' 
                    newImage='false' 
                    controlId='Image' 
                    imageSrc='${photo.Image}' 
                    waitingImage="images/Loading_icon.gif">
        </div>
        </fieldset>

        <input type='submit' name='submit' id='saveUser' value="Enregistrer" class="form-control btn-primary">
    </form>
    <div class="cancel">
        <button class="form-control btn-secondary" id="abortModidyPhotoCmd">Annuler</button>
    </div>
`);
    initFormValidation(); // important do to after all html injection!
    initImageUploaders();
    $('#modifyPicForm').on("submit", function (event) {
        let photo = getFormData($('#modifyPicForm'));
        event.preventDefault();
        showWaitingGif();
        if (photo.Shared == "on") {
            photo.Shared = true;
        }
        else {
            photo.Shared = false;
        }
        let result = API.UpdatePhoto(photo)
        if (result != null) {
            currentETagPhotos = result.ETag
            renderPhotosList();
        }
        else {
            renderError();
        }
    });
    $('#abortModidyPhotoCmd').on("click", function () {
        renderPhotos();
    });

}
async function renderDeletePhoto(id) {
    timeout();
    let loggedUser = await API.retrieveLoggedUser();
    if (loggedUser) {
        let photoToDelete = await API.GetPhotosById(id);
        if (!API.error) {
            eraseContent();
            UpdateHeader("Retrait de photo", "deletePhoto");
            $("#newPhotoCmd").hide();
            $("#content").append(`
                <div class="content loginForm">
                    <br>
                        <div class="form">
                        <h4> Voulez-vous vraiment effacer cette photo? </h4>
                        <span class="photoTitle">${photoToDelete.Title}</span>
                        <div class="photoImage" photoId=${photoToDelete.Id}  style="background-image:url('${photoToDelete.Image}')">
                        </div>
            </div>
                    <div class="form" >
                        <button class="form-control btn-danger"  id="deletePhotoCmd">Effacer</button>
                        <br>
                        <button class="form-control btn-secondary" id="abortPhotoAccountCmd">Annuler</button>
                    </div>
                </div>
            `);
            $("#deletePhotoCmd").on("click", async function () {
                let result = await API.DeletePhoto(id);
                if (result != null) {
                    currentETagPhotos = result.ETag
                    renderPhotosList();
                }
                else {
                    renderError();
                }
            });
            $("#abortPhotoAccountCmd").on("click", renderPhotosList);
        } else {
            renderError("Une erreur est survenue");
        }
    }
}

async function renderPhotosList(refresh = false) {
    UpdateHeader('Liste des photos', 'photosList')
    let currentUser = await API.retrieveLoggedUser();
    //timeNow();
    endOfData = false;
    let photoCount = limit * (offset + 1);
    let qs = refresh ? "?limit=" + photoCount + "&offset=" + + 0 + queryString : "?limit=" + limit + "&offset=" + offset + queryString;
    let liked = "";
    let title = "";
    let buttons = "";
    let photos = await API.GetPhotos(qs);
    if (!endOfData) {
        if (photos != null) {
            if (refresh) {
                if (contentScrollPosition != 0) {
                    restoreContentScrollPosition();
                }
                else {
                    saveContentScrollPosition();
                }
                eraseContent();
                $("#content").append($(`<div id='contentImage' class="photosLayout">`));
            }
            if (photos.data.length > 0) {
                let likes = await API.GetLikes();
                $("#content").off();
                photos.data.forEach((photo) => {
                    title = "";
                    liked = likes.data.find(like => like.ImageId == photo.Id && currentUser.Id == like.UserId) != null ? "fa fa-thumbs-up" : "fa-regular fa-thumbs-up";
                    numberOfLikes = likes.data.filter(like => like.ImageId == photo.Id);
                    numberOfLikes.forEach(like => {
                        title += like.OwnerName + "\n"
                    })
                    let date = convertToFrenchDate(photo.Date);
                    let shareIcon = photo.Shared ? `<img class="UserAvatarSmall" src="images/shared.png" />` : "";
                    if (currentUser.Id == photo.Owner.Id || (currentUser.Authorizations.writeAccess == 2 && currentUser.Authorizations.readAccess == 2)) {
                        buttons = `<span class="editCmd cmdIcon fa fa-pencil" editPhotoId="${photo.Id}" title="Modifier ${photo.Title}"></span>
                        <span class="deleteCmd cmdIcon fa fa-trash" deletePhotoId="${photo.Id}" title="Effacer ${photo.Title}"></span>`;
                    }
                    if (photo.OwnerId == currentUser.Id || photo.Shared)
                        $("#contentImage").append(`
                        <div class="photoLayout">
                        <div class="photoTitleContainer">
                        <span class="photoTitle">${photo.Title}</span>
                        ${buttons}
                        </div>
                        <div class="photoImage" photoId=${photo.Id} title_likes="${title}" style="background-image:url('${photo.Image}')">
                        <img class="UserAvatarSmall" src="${photo.Owner.Avatar}" />
                        ${shareIcon}
                        </div>
                        <div style="display:grid; grid-template-columns:300px 10px 30px">
                        <span class="photoCreationDate">${date}</span>
                        <div class="likesSummary">
                        <span class="photoCreationDate">${numberOfLikes.length}</span>
                        <span class="cmdIcon likeCmd ${liked}" likePhotoId="${photo.Id}"  title="${title}" ></span>
                        </div>
                        </div>
                        </div>
                        `)
                })
                $("#content").on("scroll", function () {
                    if ($("#content").scrollTop() + $("#content").innerHeight() > ($("#contentImage").height() - photoContainerHeight)) {
                        $("#content").off();
                        offset++;
                        renderPhotosList();
                    }
                });
                $(".photoImage").on('click', async function () {
                    let id = $(this).attr("photoId");
                    saveContentScrollPosition();
                    renderPhotoDetail(id);
                })
                $(".deleteCmd").on('click', function () {
                    let id = $(this).attr("deletePhotoId");
                    saveContentScrollPosition();
                    renderDeletePhoto(id);
                })
                $(".editCmd").on('click', function () {
                    let id = $(this).attr("editPhotoId");
                    saveContentScrollPosition();
                    eraseContent();
                    renderModifyPhoto(id);
                })
                $(".likeCmd").on('click', async function () {
                    currentETag = 1
                    let id = $(this).attr("likePhotoId");
                    let like = await API.GetUserLike(id, currentUser.Id);
                    if (like.length != 0) {
                        saveContentScrollPosition();
                        let Etag = await API.RemoveLike(like[0].Id);
                        currentETag = Etag.ETag;
                    }
                    else {
                        let data = { ImageId: id, UserId: currentUser.Id }
                        saveContentScrollPosition();
                        await API.AddLike(data);
                    }
                })
            }
            else {
                endOfData = true;
            }

        }
        else {
            renderError("Oh non!!");
        }
        if (refresh)
            restoreContentScrollPosition();
    }
}
async function renderPhotoDetail(id) {
    timeout();
    eraseContent();
    let likeCmd = "likeCmd";
    let previousOwnerName = ""
    let likes = await API.GetLikes();
    let photo = await API.GetPhotosById(id);
    let allUser = [];
    if (photo != null) {
        let date = convertToFrenchDate(photo.Date);
        eraseContent();
        let likeCss = "fa-regular fa-thumbs-up";
        currentETag = likes.ETag;
        let photoLikeId = await API.GetLikeByPhotoId(id);
        if (photoLikeId != null) {
            if (photoLikeId.length > 0) {
                likeCss = "fa fa-thumbs-up";
                likeCmd = "unlikeCmd"
                photoLikeId.forEach(like => {
                    username = like.OwnerName;
                    if (previousOwnerName != username) {
                        allUser.push("\n" + username);
                        previousOwnerName = username;
                    }

                })
            }
            $("#content").append(`
            <div class="photoDetailsOwner">
            <img class="UserAvatarSmall" src="${photo.Owner.Avatar}" />
            <span style="margin-left:10px"> ${photo.Owner.Name}</span>       
            </div>
            <hr>
            <span class="photoDetailsTitle">${photo.Title}</span>
            <img class="photoDetailsLargeImage" src="${photo.Image}" />
            <div style="display:grid; grid-template-columns: 950px 10px 30px;">
                                    <span class="photoCreationDate">${date}</span>
                                    <div class="likesSummary">
                                        <span class="photoCreationDate">${photoLikeId.length}</span>
                                        <span class="${likeCmd} cmdIcon ${likeCss}" photoId=${photo.Id} ${photoLikeId} title="${allUser}"></span>
                                    </div>
            </div>
            <div class="photoDetailsDescription">${photo.Description}</div>
            
            `);
        }


        $(".likeCmd").on("click", async function () {
            let id = $(this).attr("photoId");
            let userId = currentUser.Id;
            let likeData = { ImageId: id, userLikeId: userId };
            likeCss = "fa fa-thumbs-up";
            await API.AddLike(likeData);
        })
        $(".unlikeCmd").on("click", async function () {
            let id = $(this).attr("photoLikeId");
            likeCss = "fa-regular fa-thumbs-up";
            await API.DeleteLikeById(id);
        })
    }
    else {
        renderError("Description introuvable!");
    }
}


function renderVerify() {
    eraseContent();
    UpdateHeader("Vérification", "verify");
    $("#newPhotoCmd").hide();
    $("#content").append(`
        <div class="content">
            <form class="form" id="verifyForm">
                <b>Veuillez entrer le code de vérification de que vous avez reçu par courriel</b>
                <input  type='text' 
                        name='Code'
                        class="form-control"
                        required
                        RequireMessage = 'Veuillez entrer le code que vous avez reçu par courriel'
                        InvalidMessage = 'Courriel invalide';
                        placeholder="Code de vérification de courriel" > 
                <input type='submit' name='submit' value="Vérifier" class="form-control btn-primary">
            </form>
        </div>
    `);
    initFormValidation(); // important do to after all html injection!
    $('#verifyForm').on("submit", function (event) {
        let verifyForm = getFormData($('#verifyForm'));
        event.preventDefault();
        showWaitingGif();
        verify(verifyForm.Code);
    });
}
function renderCreateProfil() {
    noTimeout();
    eraseContent();
    UpdateHeader("Inscription", "createProfil");
    $("#newPhotoCmd").hide();
    $("#content").append(`
        <br/>
        <form class="form" id="createProfilForm"'>
            <fieldset>
                <legend>Adresse ce courriel</legend>
                <input  type="email" 
                        class="form-control Email" 
                        name="Email" 
                        id="Email"
                        placeholder="Courriel" 
                        required 
                        RequireMessage = 'Veuillez entrer votre courriel'
                        InvalidMessage = 'Courriel invalide'
                        CustomErrorMessage ="Ce courriel est déjà utilisé"/>

                <input  class="form-control MatchedInput" 
                        type="text" 
                        matchedInputId="Email"
                        name="matchedEmail" 
                        id="matchedEmail" 
                        placeholder="Vérification" 
                        required
                        RequireMessage = 'Veuillez entrez de nouveau votre courriel'
                        InvalidMessage="Les courriels ne correspondent pas" />
            </fieldset>
            <fieldset>
                <legend>Mot de passe</legend>
                <input  type="password" 
                        class="form-control" 
                        name="Password" 
                        id="Password"
                        placeholder="Mot de passe" 
                        required 
                        RequireMessage = 'Veuillez entrer un mot de passe'
                        InvalidMessage = 'Mot de passe trop court'/>

                <input  class="form-control MatchedInput" 
                        type="password" 
                        matchedInputId="Password"
                        name="matchedPassword" 
                        id="matchedPassword" 
                        placeholder="Vérification" required
                        InvalidMessage="Ne correspond pas au mot de passe" />
            </fieldset>
            <fieldset>
                <legend>Nom</legend>
                <input  type="text" 
                        class="form-control Alpha" 
                        name="Name" 
                        id="Name"
                        placeholder="Nom" 
                        required 
                        RequireMessage = 'Veuillez entrer votre nom'
                        InvalidMessage = 'Nom invalide'/>
            </fieldset>
            <fieldset>
                <legend>Avatar</legend>
                <div class='imageUploader' 
                        newImage='true' 
                        controlId='Avatar' 
                        imageSrc='images/no-avatar.png' 
                        waitingImage="images/Loading_icon.gif">
            </div>
            </fieldset>
   
            <input type='submit' name='submit' id='saveUser' value="Enregistrer" class="form-control btn-primary">
        </form>
        <div class="cancel">
            <button class="form-control btn-secondary" id="abortCreateProfilCmd">Annuler</button>
        </div>
    `);
    $('#loginCmd').on('click', renderLoginForm);
    initFormValidation(); // important do to after all html injection!
    initImageUploaders();
    $('#abortCreateProfilCmd').on('click', renderLoginForm);
    addConflictValidation(API.checkConflictURL(), 'Email', 'saveUser');
    $('#createProfilForm').on("submit", function (event) {
        let profil = getFormData($('#createProfilForm'));
        delete profil.matchedPassword;
        delete profil.matchedEmail;
        event.preventDefault();
        showWaitingGif();
        createProfil(profil);
    });
}
async function renderManageUsers() {
    timeout();
    let loggedUser = API.retrieveLoggedUser();
    if (loggedUser.isAdmin) {
        if (isVerified()) {
            showWaitingGif();
            UpdateHeader('Gestion des usagers', 'manageUsers')
            $("#newPhotoCmd").hide();
            $("#abort").hide();
            let users = await API.GetAccounts();
            if (API.error) {
                renderError();
            } else {
                $("#content").empty();
                users.data.forEach(user => {
                    if (user.Id != loggedUser.Id) {
                        let typeIcon = user.Authorizations.readAccess == 2 ? "fas fa-user-cog" : "fas fa-user-alt";
                        typeTitle = user.Authorizations.readAccess == 2 ? "Retirer le droit administrateur à" : "Octroyer le droit administrateur à";
                        let blockedClass = user.Authorizations.readAccess == -1 ? "class=' blockUserCmd cmdIconVisible fa fa-ban redCmd'" : "class='blockUserCmd cmdIconVisible fa-regular fa-circle greenCmd'";
                        let blockedTitle = user.Authorizations.readAccess == -1 ? "Débloquer $name" : "Bloquer $name";
                        let userRow = `
                        <div class="UserRow"">
                            <div class="UserContainer noselect">
                                <div class="UserLayout">
                                    <div class="UserAvatar" style="background-image:url('${user.Avatar}')"></div>
                                    <div class="UserInfo">
                                        <span class="UserName">${user.Name}</span>
                                        <a href="mailto:${user.Email}" class="UserEmail" target="_blank" >${user.Email}</a>
                                    </div>
                                </div>
                                <div class="UserCommandPanel">
                                    <span class="promoteUserCmd cmdIconVisible ${typeIcon} dodgerblueCmd" title="${typeTitle} ${user.Name}" userId="${user.Id}"></span>
                                    <span ${blockedClass} title="${blockedTitle}" userId="${user.Id}" ></span>
                                    <span class="removeUserCmd cmdIconVisible fas fa-user-slash goldenrodCmd" title="Effacer ${user.Name}" userId="${user.Id}"></span>
                                </div>
                            </div>
                        </div>           
                        `;
                        $("#content").append(userRow);
                    }
                });
                $(".promoteUserCmd").on("click", async function () {
                    let userId = $(this).attr("userId");
                    await API.PromoteUser(userId);
                    renderManageUsers();
                });
                $(".blockUserCmd").on("click", async function () {
                    let userId = $(this).attr("userId");
                    await API.BlockUser(userId);
                    renderManageUsers();
                });
                $(".removeUserCmd").on("click", function () {
                    let userId = $(this).attr("userId");
                    renderConfirmDeleteAccount(userId);
                });
            }
        } else
            renderVerify();
    } else
        renderLoginForm();
}
async function renderConfirmDeleteAccount(userId) {
    timeout();
    let loggedUser = API.retrieveLoggedUser();
    if (loggedUser) {
        let userToDelete = (await API.GetAccount(userId)).data;
        if (!API.error) {
            eraseContent();
            UpdateHeader("Retrait de compte", "confirmDeleteAccoun");
            $("#newPhotoCmd").hide();
            $("#content").append(`
                <div class="content loginForm">
                    <br>
                    <div class="form UserRow ">
                        <h4> Voulez-vous vraiment effacer cet usager et toutes ses photos? </h4>
                        <div class="UserContainer noselect">
                            <div class="UserLayout">
                                <div class="UserAvatar" style="background-image:url('${userToDelete.Avatar}')"></div>
                                <div class="UserInfo">
                                    <span class="UserName">${userToDelete.Name}</span>
                                    <a href="mailto:${userToDelete.Email}" class="UserEmail" target="_blank" >${userToDelete.Email}</a>
                                </div>
                            </div>
                        </div>
                    </div>           
                    <div class="form">
                        <button class="form-control btn-danger" id="deleteAccountCmd">Effacer</button>
                        <br>
                        <button class="form-control btn-secondary" id="abortDeleteAccountCmd">Annuler</button>
                    </div>
                </div>
            `);
            $("#deleteAccountCmd").on("click", function () {
                adminDeleteAccount(userToDelete.Id);
            });
            $("#abortDeleteAccountCmd").on("click", renderManageUsers);
        } else {
            renderError("Une erreur est survenue");
        }
    }
}
function renderEditProfilForm() {
    timeout();
    let loggedUser = API.retrieveLoggedUser();
    if (loggedUser) {
        eraseContent();
        UpdateHeader("Profil", "editProfil");
        $("#newPhotoCmd").hide();
        $("#content").append(`
            <br/>
            <form class="form" id="editProfilForm"'>
                <input type="hidden" name="Id" id="Id" value="${loggedUser.Id}"/>
                <fieldset>
                    <legend>Adresse ce courriel</legend>
                    <input  type="email" 
                            class="form-control Email" 
                            name="Email" 
                            id="Email"
                            placeholder="Courriel" 
                            required 
                            RequireMessage = 'Veuillez entrer votre courriel'
                            InvalidMessage = 'Courriel invalide'
                            CustomErrorMessage ="Ce courriel est déjà utilisé"
                            value="${loggedUser.Email}" >

                    <input  class="form-control MatchedInput" 
                            type="text" 
                            matchedInputId="Email"
                            name="matchedEmail" 
                            id="matchedEmail" 
                            placeholder="Vérification" 
                            required
                            RequireMessage = 'Veuillez entrez de nouveau votre courriel'
                            InvalidMessage="Les courriels ne correspondent pas" 
                            value="${loggedUser.Email}" >
                </fieldset>
                <fieldset>
                    <legend>Mot de passe</legend>
                    <input  type="password" 
                            class="form-control" 
                            name="Password" 
                            id="Password"
                            placeholder="Mot de passe" 
                            InvalidMessage = 'Mot de passe trop court' >

                    <input  class="form-control MatchedInput" 
                            type="password" 
                            matchedInputId="Password"
                            name="matchedPassword" 
                            id="matchedPassword" 
                            placeholder="Vérification" 
                            InvalidMessage="Ne correspond pas au mot de passe" >
                </fieldset>
                <fieldset>
                    <legend>Nom</legend>
                    <input  type="text" 
                            class="form-control Alpha" 
                            name="Name" 
                            id="Name"
                            placeholder="Nom" 
                            required 
                            RequireMessage = 'Veuillez entrer votre nom'
                            InvalidMessage = 'Nom invalide'
                            value="${loggedUser.Name}" >
                </fieldset>
                <fieldset>
                    <legend>Avatar</legend>
                    <div class='imageUploader' 
                            newImage='false' 
                            controlId='Avatar' 
                            imageSrc='${loggedUser.Avatar}' 
                            waitingImage="images/Loading_icon.gif">
                </div>
                </fieldset>

                <input type='submit' name='submit' id='saveUser' value="Enregistrer" class="form-control btn-primary">
                
            </form>
            <div class="cancel">
                <button class="form-control btn-secondary" id="abortEditProfilCmd">Annuler</button>
            </div>

            <div class="cancel">
                <hr>
                <button class="form-control btn-warning" id="confirmDelelteProfilCMD">Effacer le compte</button>
            </div>
        `);
        initFormValidation(); // important do to after all html injection!
        initImageUploaders();
        addConflictValidation(API.checkConflictURL(), 'Email', 'saveUser');
        $('#abortEditProfilCmd').on('click', renderPhotos);
        $('#confirmDelelteProfilCMD').on('click', renderConfirmDeleteProfil);
        $('#editProfilForm').on("submit", function (event) {
            let profil = getFormData($('#editProfilForm'));
            delete profil.matchedPassword;
            delete profil.matchedEmail;
            event.preventDefault();
            showWaitingGif();
            editProfil(profil);
        });
    }
}
function renderConfirmDeleteProfil() {
    timeout();
    let loggedUser = API.retrieveLoggedUser();
    if (loggedUser) {
        eraseContent();
        UpdateHeader("Retrait de compte", "confirmDeleteProfil");
        $("#newPhotoCmd").hide();
        $("#content").append(`
            <div class="content loginForm">
                <br>
                
                <div class="form">
                 <h3> Voulez-vous vraiment effacer votre compte? </h3>
                    <button class="form-control btn-danger" id="deleteProfilCmd">Effacer mon compte</button>
                    <br>
                    <button class="form-control btn-secondary" id="cancelDeleteProfilCmd">Annuler</button>
                </div>
            </div>
        `);
        $("#deleteProfilCmd").on("click", deleteProfil);
        $('#cancelDeleteProfilCmd').on('click', renderEditProfilForm);
    }
}
function renderExpiredSession() {
    stop_Periodic_Refresh();

    noTimeout();
    loginMessage = "Votre session est expirée. Veuillez vous reconnecter.";
    logout();
    endOfData = false;
    renderLoginForm();
}
async function renderLoginForm() {
    stop_Periodic_Refresh();
    noTimeout();
    eraseContent();
    UpdateHeader("Connexion", "Login");
    $("#newPhotoCmd").hide();
    $("#content").append(`
        <div class="content" style="text-align:center">
            <div class="loginMessage">${loginMessage}</div>
            <form class="form" id="loginForm">
                <input  type='email' 
                        name='Email'
                        class="form-control"
                        required
                        RequireMessage = 'Veuillez entrer votre courriel'
                        InvalidMessage = 'Courriel invalide'
                        placeholder="adresse de courriel"
                        value='${Email}'> 
                <span style='color:red'>${EmailError}</span>
                <input  type='password' 
                        name='Password' 
                        placeholder='Mot de passe'
                        class="form-control"
                        required
                        RequireMessage = 'Veuillez entrer votre mot de passe'
                        InvalidMessage = 'Mot de passe trop court' >
                <span style='color:red'>${passwordError}</span>
                <input type='submit' name='submit' value="Entrer" class="form-control btn-primary">
            </form>
            <div class="form">
                <hr>
                <button class="form-control btn-info" id="createProfilCmd">Nouveau compte</button>
            </div>
        </div>
    `);
    initFormValidation(); // important do to after all html injection!
    $('#createProfilCmd').on('click', renderCreateProfil);
    $('#loginForm').on("submit", function (event) {
        let credential = getFormData($('#loginForm'));
        event.preventDefault();
        showWaitingGif();
        login(credential);
    });
}
function getFormData($form) {
    const removeTag = new RegExp("(<[a-zA-Z0-9]+>)|(</[a-zA-Z0-9]+>)", "g");
    var jsonObject = {};
    $.each($form.serializeArray(), (index, control) => {
        jsonObject[control.name] = control.value.replace(removeTag, "");
    });
    return jsonObject;
}
////////
function timeNow() {
    const now = new Date();
    return now.getTime();
}
function secondsToDateString(dateInSeconds, localizationId = 'fr-FR') {
    const hoursOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' };
    return new Date(dateInSeconds * 1000).toLocaleDateString(localizationId, hoursOptions);
}
async function renderAddNewPhoto()/////////////
{
    noTimeout();
    eraseContent();
    UpdateHeader("Ajout de photos", "addPic");
    let loggedUser = API.retrieveLoggedUser();
    if (loggedUser == null) {
        renderError();
    }
    $("#content").append(`
        <br/>
        <form class="form" id="uploadNewPicForm"'>
            <input type="hidden" name="OwnerId" value="${loggedUser.Id}" />
            <input type="hidden" name="Date" value="" />
               
            <fieldset>
                <legend>Informations</legend>
                <input  type="text" 
                        class="form-control Alpha" 
                        name="Title" 
                        id="Title"
                        placeholder="Titre" 
                        required 
                        RequireMessage = 'Veuillez entrer un titre'
                        InvalidMessage = 'Titre invalide'/>

                        <textarea
                        class="form-control Alpha"
                        name="Description"
                        id="Description"
                        placeholder="Description"
                        required
                    ></textarea>

                <input  type="checkbox"   
                        name="Shared" 
                        id="Share" />

                <label for="Share">Partagée</label>

            </fieldset>
            <fieldset>
                <legend>Image</legend>
                <div class='imageUploader' 
                        newImage='true' 
                        controlId='Image' 
                        imageSrc='images/PhotoCloudLogo.png' 
                        waitingImage="images/Loading_icon.gif">
            </div>
            </fieldset>
   
            <input type='submit' name='submit' id='saveUser' value="Enregistrer" class="form-control btn-primary">
        </form>
        <div class="cancel">
            <button class="form-control btn-secondary" id="abortCreateProfilCmd">Annuler</button>
        </div>
    `);

    //$('#loginCmd').on('click', renderLoginForm);
    initFormValidation(); // important do to after all html injection!
    initImageUploaders();
    $('#abortCreateProfilCmd').on('click', function () { renderPhotos() });
    $('#uploadNewPicForm').on("submit", async function (event) {
        let photo = getFormData($('#uploadNewPicForm'));
        if (photo.Shared == "on") {
            photo.Shared = true;
        }
        else {
            photo.Shared = false;
        }

        photo.Date = timeNow();
        event.preventDefault();
        showWaitingGif();
        let result = await API.CreatePhoto(photo);
        if (result != null) {
            saveContentScrollPosition();
            currentETagPhotos = result.ETag
            renderPhotos();
        }
        else {
            renderError("Un problème est survenu!");
        }
    });
}
