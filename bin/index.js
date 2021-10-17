#!/usr/bin/env node
const yargs = require('yargs/yargs')
const fs = require('fs')
const path = require('path')
const lib = require('../lib')
const argv = yargs(process.argv).argv

const schemaFile = path.join(process.cwd(), argv.schema || 'schema.graphql')

const schemaGraphlCode = fs.readFileSync(schemaFile)

let generatedCode = lib(schemaGraphlCode)

generatedCode = `
import useSWR from "swr";
import { useState } from "react";

export const STATUSES = {
  INIT: 1,
  LOADING: 2,
  FAILED: 3,
  SUCCEED: 4,
}
${generatedCode.replace(/\n$/, '')}
`

const outputFile = path.join(process.cwd(), argv.output || 'service.js')

fs.writeFileSync(outputFile, generatedCode)
