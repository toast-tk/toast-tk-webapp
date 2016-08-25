# TOAST-TK REST service documentation
- Created : 21/04/2016
- Last Modification : 21/04/2016
- Modified By : Akram TABKA
----
# USER
## Add user

### Request

* Method : `POST`
* URL : `http://localhost:9000/user`
* Headers : `Content-Type →application/json; charset=utf-8`
* Body :
```
{
    "login": "user123",
    "password" : "95c946bf622ef93b0a211cd0fd028dfdfcf7e39e",
    "firstName" : "FirstName",
    "lastName" : "LastName",
    "email" : "login@domain.com",
    "teams" : [ "571636023584d337000272ca",
              "57164bf63584d3e3000272cb"
            ],
    "isActive": false
}
```

### Success Response

* Status : 200 OK
* Body :
```
{
  "id": "5718842b3584d3d600fa8b5e",
  "login": "user123",
  "password": "95c946bf622ef93b0a211cd0fd028dfdfcf7e39e",
  "firstName": "FirstName",
  "lastName": "LastName",
  "email": "login@domain.com",
  "teams": [
    "571636023584d337000272ca",
    "57164bf63584d3e3000272cb"
  ],
  "isActive": true
}
```
----
