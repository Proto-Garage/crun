## User
A default user called `admin` is created when `crun` is started for the first time. The `admin` user's password is set on the
`config.json` file.

### Attributes
* `username (String)`
* `password (String)`
* `creator (User)`
* `createdAt (Datetime)`
* `roles (Role[])`

A `User` can do the following operations:
* Create another `User`
* Create a `Role`
* Define a `Command`
* Define a `Group`
* Execute a `Group`
