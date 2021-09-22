let {getUsers, writeUsersJSON } = require('../data/usersDB');
const{validationResult}= require('express-validator');
const bcrypt= require('bcryptjs');

module.exports = {
    register: (req, res) => {
        res.render('users/register',{
            session: req.session,
            title: "¡Registrate!"
        });
    }, 
    processRegister: (req, res) => {
        let errors = validationResult(req);
        
        if (errors.isEmpty()) {

            let lastId = 0;
        
            getUsers.forEach(user => {
                if(user.id > lastId){
                    lastId = user.id
                }
            });

            let {
                name,
                lastName,
                email,
                pass1,
               
                phone, 
            } = req.body;

            let newUser = {
                id: lastId +1,
                name,
                lastName,
                email,
                pass: bcrypt.hashSync(pass1, 10),
                avatar: req.file ? req.file.filename : "default.png",
                category: "USER",
                phone: phone,
            };

            getUsers.push(newUser);

            writeUsersJSON(getUsers);

            res.redirect('/users/login')
        } else{
            res.render('users/register',{
                errors : errors.mapped(),
                old: req.body
            });
        }
    },
    login: (req, res) => {        
        res.render('users/login', {
            title: "¡Inicia sesión!",
            session: req.session
        });
    },
    processLogin: (req, res) => {
        let errors = validationResult(req);
            
        if(errors.isEmpty()){

            let user = getUsers.find(user => user.email === req.body.email);

            req.session.user = { 
                id: user.id,
                name: user.name,
                last_name: user.last_name,
                email: user.email,
                avatar: user.avatar,
                category: user.category,
                phone: user.phone
            }

            if(req.body.remember) {
                res.cookie('niceSweet',req.session.user,{expires: new Date(Date.now() + 900000), httpOnly: true})
            }

            res.locals.user = req.session.user;
        
            res.redirect('/')

        } else{
            res.render('users/login', {
                errors: errors.mapped(), 
                session: req.session 
            });
        }
    },
    profile: (req, res) => {     
        let user = getUsers.find(user=> user.id === req.session.user.id);

        res.render('users/profile',{
            title: "¡Tus datos!",
            session: req.session,
            user
        });
    },
    editProfile: (req, res) => {
        let user = getUsers.find(user => user.id === +req.params.id)

        res.render('users/edit', {
            title: "¡Tus datos!",
            user,
            session: req.session
        })
    },
    updateProfile: (req, res) => {        
        let errors = validationResult(req);
            
        if(errors.isEmpty()){
            let user = getUsers.find(user => user.id === +req.params.id)
            
            let { 
                name, 
                lastName,
                phone,
            } = req.body;

            user.id = user.id
            user.name = name
            user.lastName = lastName
            user.phone = phone
            user.avatar = req.file ? req.file.filename : user.avatar

            writeUsersJSON(getUsers);

            delete user.pass;          
            req.session.user = user;
            
            res.redirect("/users/profile");

        } else {
            res.render('users/edit', {
                errors: errors.mapped(),
                old: req.body,
                session: req.session 
            }); 
        }
    },
    logout: (req, res) =>{
        req.session.destroy();
        if(req.cookies.userNiceSweet){
            res.cookie('userNiceSweet','',{maxAge: -1})
        }
        
        return res.redirect('/')
    },
};