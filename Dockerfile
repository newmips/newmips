FROM node:fermium
LABEL maintainer.name="Newmips" maintainer.email="contact@newmips.com"

# Clean node_modules && workspace for image creation
RUN rm -rf node_modules/
RUN rm -rf workspace/

# Update package and install needed module
RUN apt-get update && apt-get -qq -y install pdftk && apt-get -y install nano && apt-get -y install mysql-client

# Main folder
RUN mkdir /newmips
WORKDIR /newmips
COPY . /newmips

# Workspace folder
RUN mkdir -p /newmips/workspace
COPY /structure/template/package.json /newmips/workspace

# Expose newmips and workspace ports
EXPOSE 1337 9001-9100

# Entrypoint
RUN chmod 777 /newmips/entrypoint.sh
ENTRYPOINT ["/newmips/entrypoint.sh"]