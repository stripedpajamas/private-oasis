# private-oasis
This repo is a fork of https://github.com/fraction/oasis that I manually keep up-to-date. The difference is there is a password to access anything on the site. The reasoning behind doing this is that my wife uses a Chromebook and as such doesn't have a good way of accessing / interacting with the scuttlebutt social network. This way her scuttlebutt identity can live on a remote server (in Linode or Amazon, etc) and Oasis can be exposed to the public. 

The authentication wrapper is expecting a function `getPwdHash()` that returns a bcrypt-hashed password string. 


## License

AGPL-3.0
