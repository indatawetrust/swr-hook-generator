#!/usr/bin/env node
const yargs = require('yargs/yargs')
const fs = require('fs')
const path = require('path')
const lib = require('../lib')
const argv = yargs(process.argv).argv

const schemaFile = path.join(process.cwd(), argv.schema || 'schema.graphql')

const schemaGraphlCode = fs.readFileSync(schemaFile)

let generatedCode = lib(schemaGraphlCode)

const outputFile = path.join(process.cwd(), argv.output || 'service.js')

fs.writeFileSync(outputFile, generatedCode)
