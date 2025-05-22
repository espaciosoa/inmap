# Local testing and mocking

These files serve to test endpoints and insert data using mocks of well formed objects

Execute the files using the environment variable NODE_TLS_REJECT_UNAUTHORIZED=0 to overcome problems if using a self-signed certificate and HTTPs

``` 
NODE_TLS_REJECT_UNAUTHORIZED=0 node sendMocks¡.cjs
```