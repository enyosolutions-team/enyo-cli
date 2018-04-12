module.exports = `

server {
    listen 80;
    server_name {{app_name}}.enyosolutions.com;
    root /apps/{{app_name}}/dist;

    location / {
        try_files $uri $uri/ /index.html;
    }
}

`;
