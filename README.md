# sc-angular
TODO

### Usage
    /dist/sc-angular.js
    OR
    /dist/sc-angular.min.js
    
(...) exposes angular services: `scCore`, `scCrud`, `scMxl`.

#### Authentication
(...) `auth = { user: String, password: String }`

#### API
(...)

##### Examples

    scCrud.users
    .findSelf(auth)
    .then(function (...

    scCrud.types
    .findAll(auth)
    .then(function (...
    
    scCrud.entities
    .remove(auth, entity)
    .then(function (...

(...)

    scMxl
    .query(auth, queryString, workspaceId)
    .then(function (...`

### Build
    npm install
    npm install -g bower
    bower install
    npm install -g grunt
    npm install -g grunt-cli
    grunt

### Contributing
TODO
