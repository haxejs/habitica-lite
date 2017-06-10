FROM centos:7
MAINTAINER Richard Shi

LABEL name="habiticalite"
LABEL vendor="haxejs"

RUN yum -y install gcc gcc-c++ make

ADD node-v6.10.3-linux-x64.tar.xz /
RUN cp -a /node-v6.10.3-linux-x64/* /usr/ 
RUN rm -rf /node-v6.10.3-linux-x64


#RUN npm config set registry https://registry.cnpmjs.org
RUN npm config set registry https://registry.npm.taobao.org
#RUN npm install npm@latest -g
#RUN npm install -g node-gyp @angular/cli
RUN npm install -g node-gyp @angular/cli@1.0.0


ADD .   /opt/habiticalite
RUN rm -fr /opt/habiticalite/node_modules
#RUN rm -fr /opt/habiticalite/client/node_modules
#RUN rm -fr /opt/habiticalite/client/dist

RUN cd /opt/habiticalite && npm install
#RUN cd /opt/habiticalite/client && npm install
#RUN cd /opt/habiticalite/client && ng build --env=demo

RUN yum -y install patch
RUN cd /opt/habiticalite && /bin/sh patchesCheck.sh

WORKDIR /opt/habiticalite
# Start habiticalite
EXPOSE 3000
CMD ["npm", "start"]
