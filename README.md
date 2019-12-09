# chat1-be
Node/Express back end for demo chat app


## Deploy to Azure
- Make sure that Azure App Service CI is configured per instuctions in chat1-azure/README.md
- Push to the "master" branch on github
- Azure App Service CI will deploy the latest build automatically

## Run locally
- Install MongoDB instance locally, create a database "chat1" and populate collection "collection1" with sample documents in the format like '{index: 1, title: "Document1"}' This sample data can be fetched by API clients via GET request to '/test' endpoint.
- Execute: npm start
