# sc-angular
TODO

### Usage
Download either `/dist/sc-angular.js` or `/dist/sc-angular.min.js` from this repository and link it in your `index.html`.
After that, add the `sc-angular` module as a dependency to your application module:

```javascript
angular.module('myApp', ['sociocortex']);
```

The module exposes angular services: `scCore`, `scCrud`, `scMxl`, `scUtils`.

(...)

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
    .then(function (...

### Build
    npm install
    npm install -g bower
    bower install
    npm install -g grunt
    npm install -g grunt-cli
    grunt

### Contributing
TODO
