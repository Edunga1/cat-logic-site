# Introduction

A static site module for cat-logic.

`npm install` to install dependencies.
then `npm run develop` to run the site locally.

## Structure

`src/` contains all the source code for the site.
any code outside of `src/` is all about gatsbyjs or build tools.

```bash
├── src
│   ├── components                      # atomic components but gatsby-templates may not
│   │   may atoms
│   │   ├── gatsby-templates
│   │   │   └── Wiki.tsx                # contains query for wiki page
│   │   ├── molecules
│   │   └── templates
│   ├── constants
│   ├── content -> ../../docs/wiki      # symlink to wiki content
│   ├── pages                           # gatsby specified. contains pages
│   │   └── index.tsx                   # contains query for wiki index page
│   ├── related-docs                    # feature for related documents
│   └── utils                           # utility functions
└── static
    └── google68bb58d8f63dc89d.html     # google search console verification
```
