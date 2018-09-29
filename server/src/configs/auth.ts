import * as passport from "passport";
import {
    Strategy as BearerStrategy
} from "passport-http-bearer";

import {
    User
} from "../components/users/domains";

export function setupAuth(app) {
    passport.use(new BearerStrategy(function (token, done) {
        User.findOne({
            token: token
        }, function (err, user) {
            if (err) {
                return done(err);
            }
            if (!user) {
                return done(undefined, false);
            }
            return done(undefined, user, {
                scope: "all"
            });
        });
    }));
    // passport.serializeUser(( < any > User).serializeUser());
    // passport.deserializeUser(( < any > User).deserializeUser());

    app.use(passport.authenticate("bearer", {
        session: false
    }));
    app.use(passport.initialize());
    // app.use((req: any, res: any, next: any) => {
    //     res.locals.user = req.user;
    //     next();
    // });
}