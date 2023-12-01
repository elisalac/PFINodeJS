//import { getLogger } from "nodemailer/lib/shared";
// import HttpContext from "../httpContext";
// import User from "../models/user";
// import { makeVerifyCode } from "../utilities";



let contentScrollPosition = 0;
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/// Views rendering
Init_UI();

function Init_UI() {
    renderLogin();
}

function renderLogin(Email = "", EmailError = "", passwordError = "", loginMessage = "") {
    eraseContent();
    updateHeader("Connexion", "Login");
    if (EmailError == undefined) {
        EmailError = "";
    }
    if (Email == '[object Object]') {
        Email = "";
    }
    $("#content").append($(`<h3>${loginMessage}</h3>
    <form class="form" id="loginForm">
    <input type='email'
    name='Email'
    id='mail'
    class="form-control"
    required
    RequireMessage = 'Veuillez entrer votre courriel'
    InvalidMessage = 'Courriel invalide'
    placeholder="Courriel"
    value='${Email}'>
    <span style='color:red'>${EmailError}</span>
    <input type='password'
    id = 'pass'
    name='Password'
    placeholder='Mot de passe'
    class="form-control"
    required
    RequireMessage = 'Veuillez entrer votre mot de passe'>
    <span style='color:red'>${passwordError}</span>
    <input type='submit' name='submit' value="Entrer" class="form-control btn-primary">
    </form>
    <div class="form">
    <hr>
    <button class="form-control btn-info" id="createProfilCmd">Nouveau compte</button>
    </div>
    `))
    $('#createProfilCmd').on('click', renderCreateAccount);
    $('#loginForm').on("submit", async function (event) {
        let loginInfo = getFormData($('#loginForm'))
        event.preventDefault();
        showWaitingGif();
        let result = await API.login(loginInfo.Email, loginInfo.Password)
        if (result) {
            let code = await API.retrieveLoggedUser();
            console.log(code.VerifyCode)
            if (code.VerifyCode != "verified") {
                renderVerifyForm();
            }
            else {
                renderImages();
            }
        }
        else {
            switch (API.currentStatus) {
                case 481:
                    { renderLogin('', 'Courriel introuvable'); break; }
                case 482:
                    { renderLogin(loginInfo.Email, '', 'Mot de passe incorrect'); break; }
                default:
                    {
                        renderServerError();
                        //faire fonction pour gérer pas de connexion avec serveur(fonction render comme dans énoncé)
                    }
            }
        }

    });
}

function renderServerError() {
    eraseContent();
    updateHeader("Problème", "Login");
    $("#content").append($(`<div class="content" style="text-align:center">
        <span style='color:red; font-weight:bold;'>Le serveur ne répond pas</span>
        <hr>
        <div class="form">
            <button class="form-control btn-primary" id="connectCmd">Connexion</button>
        </div>
        </div>
    `));
    $("#connectCmd").on("click", renderLogin);
}

function renderVerifyForm() {
    eraseContent(); // effacer le conteneur #content
    updateHeader("Vérification", "verif");
    $("#content").append($(`
    <div class="content" style="text-align:center">
        <h5 style="margin-top:30px">Veuillez entrer le code de vérification que vous avez reçus par courriel</h5>
        <form class="form" id="verifyForm">
            <input type='text'
            id='code'
            name='Code'
            class="form-control"
            placeholder="Code de vérification de courriel">
        </form>
        <div class="form">
            <button class="form-control btn-primary" id="verifyCmd">Vérifier</button>
        </div>
    </div>
    `))
    $('#verifyCmd').on("click", async function (event) {
        let code = getFormData($('#verifyForm'));
        event.preventDefault();
        let userid = API.retrieveLoggedUser().Id;
        let result = await API.verifyEmail(userid, code.Code);
        if (result) {
            renderImages();
        }
        else {
            API.logout();
            renderLogin();//erreur c'est produite
        }
    });
}

function renderCreateAccount() {
    noTimeout(); // ne pas limiter le temps d’inactivité
    eraseContent(); // effacer le conteneur #content
    updateHeader("Inscription", "createProfil"); // mettre à jour l’entête et menu
    $("#newPhotoCmd").hide(); // camouffler l’icone de commande d’ajout de photo
    $("#content").append($(`
    <form class="form" id="createProfilForm"'>
    <fieldset>
    <legend>Adresse ce courriel</legend>
    <input type="email"
    class="form-control Email"
    name="Email"
    id="Email"
    placeholder="Courriel"
    required
    RequireMessage = 'Veuillez entrer votre courriel'
    InvalidMessage = 'Courriel invalide'
    CustomErrorMessage ="Ce courriel est déjà utilisé"/>
    <input class="form-control MatchedInput"
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
    <input type="password"
    class="form-control"
    name="Password"
    id="Password"
    placeholder="Mot de passe"
    required
    RequireMessage = 'Veuillez entrer un mot de passe'
    InvalidMessage = 'Mot de passe trop court'/>
    <input class="form-control MatchedInput"
    type="password"
    matchedInputId="Password"
    name="matchedPassword"
    id="matchedPassword"
    placeholder="Vérification" required
    InvalidMessage="Ne correspond pas au mot de passe" />
    </fieldset>
    <fieldset>
    <legend>Nom</legend>
    <input type="text"
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
    <input type='submit' name='submit' id='saveUserCmd' value="Enregistrer" class="form-control btn-primary">
    </form>
    <div class="cancel">
    <button class="form-control btn-secondary" id="abortCmd">Annuler</button>
    </div>
    `))
    $('#loginCmd').on('click', renderLogin); // call back sur clic
    initFormValidation();
    initImageUploaders();
    $('#abortCmd').on('click', function () {
        renderLogin();
    }); // call back sur clic
    addConflictValidation(API.checkConflictURL(), 'Email', 'saveUserCmd');
    $('#createProfilForm').on("submit", function (event) {
        let profil = getFormData($('#createProfilForm'));
        delete profil.matchedPassword;
        delete profil.matchedEmail;
        event.preventDefault();// empêcher le fureteur de soumettre une requête de soumission
        showWaitingGif(); // afficher GIF d’attente
        createProfil(profil); // commander la création au service API
    });

}

function showWaitingGif() {
    eraseContent();
    $("#content").append($("<div class='waitingGifcontainer'><img class='waitingGif' src='./Loading_icon.gif' /></div>'"));
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

function updateHeader(title, type) {
    $("#header").empty();
    if (type == 'createProfil' || type == 'Login') {
        $("#header").append($(`<img id='photoTitleContainer' src='./favicon.ico'/><h2>${title}</h2>
        <div class="dropdown ms-auto dropdownLayout"> 
            <div data-bs-toggle="dropdown" aria-expanded="false"> 
                <i class="cmdIcon fa fa-ellipsis-vertical"></i> 
            </div>
            <div class="dropdown-menu noselect">
            <span class="dropdown-item" id="loginCmd"> 
                <i class="menuIcon fa fa-sign-in mx-2"></i> Connexion 
            </span>
            <div class="dropdown-divider"></div> 
            <span class="dropdown-item" id="aboutCmd"> 
                <i class="menuIcon fa fa-info-circle mx-2" id='aboutCmd'></i> À propos... </span>
            </div> 
        </div>`));
    }
    else if (type == "connected") {
        if (API.retrieveLoggedUser() != undefined) {
            let user = API.retrieveLoggedUser();
            let isAdmin = "";
            if (user.Authorizations.readAccess == 2 && user.Authorizations.writeAccess == 2) {
                isAdmin = `<span class="dropdown-item" id="manageUserCm">
                <i class="menuIcon fas fa-user-cog mx-2"></i> 
                Gestion des usagers 
                </span>
                <div class="dropdown-divider"></div>`;
            }

            $("#header").append($(`
            <img id='photoTitleContainer' src='./favicon.ico'/><h2>${title}</h2>
            <img id='UserAvatarSmall' class='UserAvatarSmall' src='${user.Avatar}'>
             <div class="dropdown ms-auto dropdownLayout">
            <div data-bs-toggle="dropdown" aria-expanded="false">
            <i class="cmdIcon fa fa-ellipsis-vertical"></i>
            </div>
            <div class="dropdown-menu noselect">
            ${isAdmin}
            <span class="dropdown-item" id="logoutCmd">
            <i class="menuIcon fa fa-sign-out mx-2"></i>
            Déconnexion 
            </span>
            <span class="dropdown-item" id="editProfilMenuCmd">
            <i class="menuIcon fa fa-user-edit mx-2"></i>
            Modifier votre profil
            </span> <div class="dropdown-divider">
            </div> <span class="dropdown-item" id="listPhotosMenuCmd">
            <i class="menuIcon fa fa-image mx-2"></i>
            Liste des photos 
            </span>
            <div class="dropdown-divider"></div> 
            <span class="dropdown-item" id="sortByDateCmd"> 
            <i class="menuIcon fa fa-check mx-2"></i>
            <i class="menuIcon fa fa-calendar mx-2"></i> 
            Photos par date de création 
            </span> 
            <span class="dropdown-item" id="sortByOwnersCmd"> 
            <i class="menuIcon fa fa-fw mx-2"></i> 
            <i class="menuIcon fa fa-users mx-2"></i> 
            Photos par créateur 
            </span> 
            <span class="dropdown-item" id="sortByLikesCmd"> 
            <i class="menuIcon fa fa-fw mx-2"></i> 
            <i class="menuIcon fa fa-user mx-2"></i> 
            Photos les plus aiméés 
            </span> 
            <span class="dropdown-item" id="ownerOnlyCmd"> 
            <i class="menuIcon fa fa-fw mx-2"></i> 
            <i class="menuIcon fa fa-user mx-2"></i> 
            Mes photos 
            </span> 
            <div class="dropdown-divider"></div> 
            <span class="dropdown-item" id="aboutCmd"> 
            <i class="menuIcon fa fa-info-circle mx-2"></i> 
            À propos... 
            </span> 
            </div> 
            </div>`));
        }
    }
    else if (type == 'verif') {
        $("#header").append($(`<img id='photoTitleContainer' src='./favicon.ico'/><h2>${title}</h2>
        <div class="dropdown ms-auto dropdownLayout"> 
            <div data-bs-toggle="dropdown" aria-expanded="false"> 
                <i class="cmdIcon fa fa-ellipsis-vertical"></i> 
            </div>
            <div class="dropdown-menu noselect">
            <span class="dropdown-item" id="logoutCmd"> 
                <i class="menuIcon fa fa-sign-out mx-2"></i> Déconnexion 
            </span>
            <div class="dropdown-divider"></div> 
            <span class="dropdown-item" id="aboutCmd"> 
                <i class="menuIcon fa fa-info-circle mx-2" id='aboutCmd'></i> À propos... </span>
            </div> 
        </div>`));
    }
    else if (type == "about") {
        let user = API.retrieveLoggedUser();
        if (user != null) {
            if (user.VerifyCode == 'verified') {
                $("#header").append($(`
            <img id='photoTitleContainer' src='./favicon.ico'/><h2>${title}</h2>
            <img id='avatarUser' class='UserAvatarSmall' src='${user.Avatar}'>
             <div class="dropdown ms-auto dropdownLayout"> <div data-bs-toggle="dropdown" aria-expanded="false"> <i class="cmdIcon fa fa-ellipsis-vertical"></i> </div> <div class="dropdown-menu noselect"> <span class="dropdown-item" id="manageUserCm"> <i class="menuIcon fas fa-user-cog mx-2"></i> Gestion des usagers </span> <div class="dropdown-divider"></div> <span class="dropdown-item" id="logoutCmd"> <i class="menuIcon fa fa-sign-out mx-2"></i> Déconnexion </span> <span class="dropdown-item" id="editProfilMenuCmd"> <i class="menuIcon fa fa-user-edit mx-2"></i> Modifier votre profil </span> <div class="dropdown-divider"></div> <span class="dropdown-item" id="listPhotosMenuCmd"> <i class="menuIcon fa fa-image mx-2"></i> Liste des photos </span> <div class="dropdown-divider"></div> <span class="dropdown-item" id="sortByDateCmd"> <i class="menuIcon fa fa-check mx-2"></i> <i class="menuIcon fa fa-calendar mx-2"></i> Photos par date de création </span> <span class="dropdown-item" id="sortByOwnersCmd"> <i class="menuIcon fa fa-fw mx-2"></i> <i class="menuIcon fa fa-users mx-2"></i> Photos par créateur </span> <span class="dropdown-item" id="sortByLikesCmd"> <i class="menuIcon fa fa-fw mx-2"></i> <i class="menuIcon fa fa-user mx-2"></i> Photos les plus aiméés </span> <span class="dropdown-item" id="ownerOnlyCmd"> <i class="menuIcon fa fa-fw mx-2"></i> <i class="menuIcon fa fa-user mx-2"></i> Mes photos </span> <div class="dropdown-divider"></div> <span class="dropdown-item" id="aboutCmd"> <i class="menuIcon fa fa-info-circle mx-2"></i> À propos... </span> </div> </div>`));
            }
            else {
                $("#header").append($(`<img id='photoTitleContainer' src='./favicon.ico'/><h2>${title}</h2>
                <div class="dropdown ms-auto dropdownLayout"> 
                    <div data-bs-toggle="dropdown" aria-expanded="false"> 
                        <i class="cmdIcon fa fa-ellipsis-vertical"></i> 
                    </div>
                    <div class="dropdown-menu noselect">
                    <span class="dropdown-item" id="loginCmd"> 
                        <i class="menuIcon fa fa-sign-in mx-2"></i> Connexion 
                    </span>
                    <div class="dropdown-divider"></div> 
                    <span class="dropdown-item" id="aboutCmd"> 
                        <i class="menuIcon fa fa-info-circle mx-2" id='aboutCmd'></i> À propos... </span>
                    </div> 
                </div>`));
            }
        }
        else {
            $("#header").append($(`<img id='photoTitleContainer' src='./favicon.ico'/><h2>${title}</h2>
            <div class="dropdown ms-auto dropdownLayout"> 
                <div data-bs-toggle="dropdown" aria-expanded="false"> 
                    <i class="cmdIcon fa fa-ellipsis-vertical"></i> 
                </div>
                <div class="dropdown-menu noselect">
                <span class="dropdown-item" id="logoutCmd"> 
                    <i class="menuIcon fa fa-sign-out mx-2"></i> Déconnexion 
                </span>
                <div class="dropdown-divider"></div> 
                <span class="dropdown-item" id="aboutCmd"> 
                    <i class="menuIcon fa fa-info-circle mx-2" id='aboutCmd'></i> À propos... </span>
                </div> 
            </div>`));
        }
    }
    else if (type == "UsersManager") {
        let user = API.retrieveLoggedUser();
        $("#header").append($(`<img id='photoTitleContainer' src='./favicon.ico'/><h2>${title}</h2>
        <img id='UserAvatarSmall' class='UserAvatarSmall' src='./images/adminLogo.png'>
        <div class="dropdown ms-auto dropdownLayout">
        <div data-bs-toggle="dropdown" aria-expanded="false">
            <i class="cmdIcon fa fa-ellipsis-vertical"></i>
        </div>
        <div class="dropdown-menu noselect">
            <span class="dropdown-item" id="manageUserCm">
                <i class="menuIcon fas fa-user-cog mx-2"></i> 
                Gestion des usagers 
            </span>
        <div class="dropdown-divider"></div>
            <span class="dropdown-item" id="logoutCmd">
            <i class="menuIcon fa fa-sign-out mx-2"></i>
            Déconnexion 
            </span>
            <span class="dropdown-item" id="editProfilMenuCmd">
            <i class="menuIcon fa fa-user-edit mx-2"></i>
            Modifier votre profil
            </span> <div class="dropdown-divider">
        </div> 
        <span class="dropdown-item" id="listPhotosMenuCmd">
            <i class="menuIcon fa fa-image mx-2"></i>
            Liste des photos 
        </span>
        <div class="dropdown-divider"></div> 
            <span class="dropdown-item" id="sortByDateCmd"> 
                <i class="menuIcon fa fa-check mx-2"></i>
                <i class="menuIcon fa fa-calendar mx-2"></i> 
                Photos par date de création 
            </span> 
            <span class="dropdown-item" id="sortByOwnersCmd"> 
                <i class="menuIcon fa fa-fw mx-2"></i> 
                <i class="menuIcon fa fa-users mx-2"></i> 
                Photos par créateur 
            </span> 
            <span class="dropdown-item" id="sortByLikesCmd"> 
                <i class="menuIcon fa fa-fw mx-2"></i> 
                <i class="menuIcon fa fa-user mx-2"></i> 
                Photos les plus aiméés 
            </span> 
            <span class="dropdown-item" id="ownerOnlyCmd"> 
                <i class="menuIcon fa fa-fw mx-2"></i> 
                <i class="menuIcon fa fa-user mx-2"></i> 
                Mes photos 
            </span> 
            <div class="dropdown-divider"></div> 
                <span class="dropdown-item" id="aboutCmd"> 
                    <i class="menuIcon fa fa-info-circle mx-2"></i> 
                    À propos... 
                </span> 
            </div> 
        </div>`));
    }
    $('#loginCmd').on('click', renderLogin);
    $('#aboutCmd').on('click', renderAbout);
    $('#logoutCmd').on('click', renderlogout);
    $('#editProfilMenuCmd').on('click', renderModify);
    $('#manageUserCm').on('click', renderUserManager);
}

function renderlogout() {
    API.logout()
    updateHeader("Connexion", 'Login');
    renderLogin()
}

function getFormData($form) {
    const removeTag = new RegExp("(<[a-zA-Z0-9]+>)|(</[a-zA-Z0-9]+>)", "g");
    var jsonObject = {};
    $.each($form.serializeArray(), (index, control) => {
        jsonObject[control.name] = control.value.replace(removeTag, "");
    });
    return jsonObject;
}

async function createProfil(profil) {
    let result = await API.register(profil)
    if (result) {
        renderLogin("", "", "", "Votre compte a été créé. Veuillez prendre vos courriels pour réccupérer votre code de vérification qui vous sera demandé lors de votre prochaine connexion.");
    }
    else {
        //king
    }

}

function renderImages() {
    timeout();
    eraseContent();
    updateHeader('Liste des photos', 'connected')
    $("#content").append(
        $(`
        <h2 style="margin-left:20px; margin-top:20px">En construction</h2>
        `))
}

function renderAbout() {
    timeout();
    saveContentScrollPosition();
    eraseContent();
    updateHeader("À propos...", "about");

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
                    Auteur: William Sauvé et Elisa Lacombe
                </p>
                <p>
                    Collège Lionel-Groulx, automne 2023
                </p>
            </div>
        `))
}

function renderModify() {
    let user = API.retrieveLoggedUser();
    eraseContent();
    $("#content").append($(`
    <form class="form" id="editProfilForm"'>
    <input type="hidden" name="Id" id="Id" value="${user.Id}"/>
    <fieldset>
    <legend>Adresse ce courriel</legend>
    <input type="email"
    class="form-control Email"
    name="Email"
    id="Email"
    placeholder="Courriel"
    required
    RequireMessage = 'Veuillez entrer votre courriel'
    InvalidMessage = 'Courriel invalide'
    CustomErrorMessage ="Ce courriel est déjà utilisé"
    value="${user.Email}" >
    <input class="form-control MatchedInput"
    type="text"
    matchedInputId="Email"
    name="matchedEmail"
    id="matchedEmail"
    placeholder="Vérification"
    required
    RequireMessage = 'Veuillez entrez de nouveau votre courriel'
    InvalidMessage="Les courriels ne correspondent pas"
    value="${user.Email}" >
    </fieldset>
    <fieldset>
    <legend>Mot de passe</legend>
    <input type="password"
    class="form-control"
    name="Password"
    id="Password"
    placeholder="Mot de passe"
    InvalidMessage = 'Mot de passe trop court' >
    <input class="form-control MatchedInput"
    type="password"
    matchedInputId="Password"
    name="matchedPassword"
    id="matchedPassword"
    placeholder="Vérification"
    InvalidMessage="Ne correspond pas au mot de passe" >
    </fieldset>
    <fieldset>
    <legend>Nom</legend>
    <input type="text"
    class="form-control Alpha"
    name="Name"
    id="Name"
    placeholder="Nom"
    required
    RequireMessage = 'Veuillez entrer votre nom'
    InvalidMessage = 'Nom invalide'
    value="${user.Name}" >
    </fieldset>
    <fieldset>
    <legend>Avatar</legend>
    <div class='imageUploader'
    newImage='false'
    controlId='Avatar'
    imageSrc='${user.Avatar}'
    waitingImage="images/Loading_icon.gif">
    </div>
    </fieldset>
    </form>
    <div class="form">
        <button class="form-control btn-primary" id="saveUserCmd">Enregistrer</button>
    </div>
    <div class="cancel">
    <button class="form-control btn-secondary" id="abortCmd">Annuler</button>
    </div>
    <div class="cancel"> <hr>
    <button class="form-control btn-warning" id="killCmd">Effacer le compte</button>
    </div>
    `))
    $("#saveUserCmd").on("click", async function (event) {
        let profil = getFormData($('#editProfilForm'));
        delete profil.matchedEmail;
        delete profil.matchedPassword;
        event.preventDefault();
        showWaitingGif();
        let result = await API.modifyUserProfil(profil);
        if (result) {
            renderImages();
        }
    });
    $('#abortCmd').on('click', renderImages);
    $('#killCmd').on("click", renderKill);
    initFormValidation();
    initImageUploaders();
}

function renderKill() {
    eraseContent();
    $("#content").append($(`
    <div class="content" style="text-align:center">
        <h4 style="margin-top:30px">Voulez-vous vraiment effacer votre compte?</h4>
        <div class="form">
            <button class="form-control btn-danger" id="deleteCmd">Effacer mon compte</button>
        </div>
        <div class="form">
            <button class="form-control btn-secondary" id="cancelCmd">Annuler</button>
        </div>
    </div>
    `));
    $('#deleteCmd').on("click", async function (event) {
        let profil = API.retrieveLoggedUser();
        event.preventDefault();
        showWaitingGif();
        let result = await API.unsubscribeAccount(profil.Id);
        if (result) {
            renderlogout();
            renderLogin();
        }
    });
    $('#cancelCmd').on("click", renderModify);
}

function renderKillAdmin(user) {
    eraseContent();
    timeout();
    updateHeader("Retrait de compte", "UsersManager");
    $("#content").append($(`
    <div class="content" style="text-align:center">
        <h4 style="margin-top:30px">Voulez-vous vraiment effacer cet usager et toutes ses photos?</h4>
        <div class="UserLayout">
            <img id="avatarUser" class="UserAvatar"src="${user.Avatar}"/>
            <div class="UserInfo">
                <span class="UserName">${user.Name}</span>
                <span class="UserEmail">${user.Email}</span>
            </div>
        </div>
        <div class="form">
            <button class="form-control btn-danger" id="deleteCmd">Effacer mon compte</button>
        </div>
        <div class="form">
            <button class="form-control btn-secondary" id="cancelCmd">Annuler</button>
        </div>
    </div>
    `));
    $('#deleteCmd').on("click", async function (event) {
        event.preventDefault();
        showWaitingGif();
        let result = await API.unsubscribeAccount(user.Id);
        if (result) {
            renderUserManager();
        }
    });
    $('#cancelCmd').on("click", renderUserManager);
}

async function renderUserManager() {
    eraseContent();
    updateHeader("Gestion des usagers", "UsersManager");
    let currentUserId = API.retrieveLoggedUser().Id;
    let result = await API.GetAccounts();
    let users = result.data;
    let buttonAdmin = "";
    let buttonBlock = "";
    users.forEach((user) => {
        if (user.Authorizations.readAccess == 2 && user.Authorizations.writeAccess == 2) {
            buttonAdmin = '<button class="cmdIconVisible fas fa-user-cog dodgerblueCmd" style="border-width:0px" id="demoteCmd" userId="' + user.Id + '"/>';
        } else {
            buttonAdmin = '<button class="cmdIconVisible fas fa-user-alt dodgerblueCmd" style="border-width:0px" id="promoteCmd" userId="' + user.Id + '"/>';
        }
        if (user.Authorizations.readAccess == 0 && user.Authorizations.writeAccess == 0) {
            buttonBlock = '<button class="cmdIconVisible fa fa-ban redCmd" style="border-width:0px" id="blockCmd"/>'
        } else {
            buttonBlock = '<button class="cmdIconVisible fa-regular fa-circle greenCmd" style="border-width:0px" id="unblockCmd"/>';
        }
        if (user.Id != currentUserId) {
            $("#content").append($(`
            <div class="UserContainer">
                <div class="UserLayout">
                    <img id="avatarUser" class="UserAvatar"src="${user.Avatar}"/>
                    <div class="UserInfo">
                        <span class="UserName">${user.Name}</span>
                        <span class="UserEmail">${user.Email}</span>
                    </div>
                </div>
                <div class="UserCommandPanel">
                    ${buttonAdmin}
                    ${buttonBlock}
                    <button class="cmdIconVisible fas fa-user-slash goldenrodCmd" style="border-width:0px" id="removeCmd"/>
                </div>
            </div>
            `));
        }


        $('#blockCmd').on('click', function () {
            user.Authorizations.readAccess = 0;
            user.Authorizations.writeAccess = 0;
        });
        $('#unblockCmd').on('click', function () {
            user.Authorizations.readAccess = 1;
            user.Authorizations.writeAccess = 1;
        });
        $('#removeCmd').on('click', function () {
            renderKillAdmin(user);
        });
    });
    $('#promoteCmd').on('click', async function () {
        let userId = $(this).attr("userId");
        console.log(await API.getUserById(userId));
        let result = await API.getUserById(userId);
        if (result) {
            renderUserManager();
        }
    });
    $('#demoteCmd').on('click', function () {
        user.Authorizations.readAccess = 1;
        user.Authorizations.writeAccess = 1;
    });
}