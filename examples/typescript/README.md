# TypeScript example

## Installation

```sh
# Install the dependencies
npm install

# Install tools to get type definition files
# You only need to do this once, if you haven't already installed this tools
npm install -g typings
npm install -g tsdm

# Install ambient type definitions for standard node APIs
typings install dt~node --global

# Install streamline ambient type definitions
tsdm rewire
```

Note: You only need the first step to just run the example. 
The other steps install the type definitions to get the best out of vscode

## Running with _node

```sh
_node src/diskUsage
```

Notice that the file will be compiled on the fly.

## Running with node 

```sh
# First, compile
_node -d out -c src/diskUsage.ts 
# then run
node out/diskUsage
```

## Editing

Open the project with vscode and enjoy the experience.
