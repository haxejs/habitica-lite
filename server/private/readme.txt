文件说明：

1. 证书文件214086521170803.pem，包含两段内容，请不要删除任何一段内容。

2. 如果是证书系统创建的CSR，还包含：证书私钥文件214086521170803.key。

( 1 ) 在Nginx的安装目录下创建cert目录，并且将下载的全部文件拷贝到cert目录中。如果申请证书时是自己创建的CSR文件，请将对应的私钥文件放到cert目录下并且命名为214086521170803.key；

( 2 ) 打开 Nginx 安装目录下 conf 目录中的 nginx.conf 文件，找到：

# HTTPS server
# #server {
# listen 443;
# server_name localhost;
# ssl on;
# ssl_certificate cert.pem;
# ssl_certificate_key cert.key;
# ssl_session_timeout 5m;
# ssl_protocols SSLv2 SSLv3 TLSv1;
# ssl_ciphers ALL:!ADH:!EXPORT56:RC4+RSA:+HIGH:+MEDIUM:+LOW:+SSLv2:+EXP;
# ssl_prefer_server_ciphers on;
# location / {
#
#
#}
#}
( 3 ) 将其修改为 (以下属性中ssl开头的属性与证书配置有直接关系，其它属性请结合自己的实际情况复制或调整) :

server {
    listen 443;
    server_name localhost;
    ssl on;
    root html;
    index index.html index.htm;
    ssl_certificate   cert/214086521170803.pem;
    ssl_certificate_key  cert/214086521170803.key;
    ssl_session_timeout 5m;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE:ECDH:AES:HIGH:!NULL:!aNULL:!MD5:!ADH:!RC4;
    ssl_protocols TLSv1 TLSv1.1 TLSv1.2;
    ssl_prefer_server_ciphers on;
    location / {
        root html;
        index index.html index.htm;
    }
}
保存退出。

( 4 )重启 Nginx。

( 5 ) 通过 https 方式访问您的站点，测试站点证书的安装配置。如遇到证书不信任问题，请查看相关文档。