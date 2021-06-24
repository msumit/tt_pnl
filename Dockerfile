FROM node
COPY index.js .
EXPOSE 3333
CMD [ "node", "index.js" ]