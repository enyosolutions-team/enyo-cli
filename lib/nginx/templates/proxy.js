module.exports = `
server {
    listen 80;
    server_name {{app_name}}.enyosolutions.com;
    root /apps/{{app_name}}/dist;

    location / {
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   Host      $http_host;
        proxy_pass         http://127.0.0.1:{{app_port}};
    }
}
`;
