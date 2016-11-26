## User
A default user called `admin` is created when `crun` is started for the first time. The `admin` user
may be used to created
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

### Attributes
