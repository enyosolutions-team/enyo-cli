module.exports = `

server {
    listen   80; ## listen for ipv4; this line is default and implied
    listen  8080;
    include /etc/nginx/user_agents_block.lst;

    root /apps/{{app_name}};

    access_log  /var/log/nginx/{{app_name}}_access.log;
    error_log  /var/log/nginx/{{app_name}}_error.log debug;

    index index.html index.htm app.php index_prod.php index.php;

    server_name {{app_name}}.enyosolutions.com;
    location = /robots.txt {
        log_not_found off;
        access_log off;
    }

    include h5bp/basic.conf;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ [^/]\.php(/|$) {
        fastcgi_split_path_info ^(.+?\.php)(/.*)$;
        fastcgi_pass php7.1-fpm.sock;
        fastcgi_index app.php;
        fastcgi_read_timeout 1200;
        include fastcgi_params;
    }
}
`;
