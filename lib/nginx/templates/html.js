module.exports = `

server {
    listen 80;
    server_name {{appName}}.enyosolutions.com;
    root /apps/{{appName}}/dist;

    location / {
        try_files $uri $uri/ /index.html;
    }
}

`;
