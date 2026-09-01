import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const skillsDirectory = resolve('.agents/skills')
const errors = []
const requiredSkillNames = [
  'learning-web-change-review',
  'learning-web-cross-cutting-change',
  'learning-web-feature-delivery',
  'learning-web-react-engineering',
]
const governanceDocumentPaths = [
  'AGENTS.md',
  'docs/ai-collaboration.md',
  'docs/ai-skills.md',
]
const requiredSkillReferences = new Map([
  ['learning-web-change-review', ['learning-web-react-engineering']],
  ['learning-web-cross-cutting-change', ['learning-web-feature-delivery', 'learning-web-react-engineering']],
  ['learning-web-feature-delivery', ['learning-web-cross-cutting-change', 'learning-web-react-engineering']],
])

function reportError(message) {
  errors.push(message)
}

function validateSkill(skillName) {
  const skillPath = resolve(skillsDirectory, skillName, 'SKILL.md')
  const metadataPath = resolve(skillsDirectory, skillName, 'agents', 'openai.yaml')

  if (!existsSync(skillPath)) {
    reportError(`${skillName}: missing SKILL.md`)
    return
  }

  const content = readFileSync(skillPath, 'utf8')
  const frontmatter = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/)

  if (frontmatter === null) {
    reportError(`${skillName}: SKILL.md must start with YAML frontmatter`)
    return
  }

  const name = frontmatter[1].match(/^name:\s*([a-z0-9-]+)\s*$/m)
  const description = frontmatter[1].match(/^description:\s*(\S[\s\S]*)$/m)

  if (name === null) reportError(`${skillName}: frontmatter requires a lowercase kebab-case name`)
  if (name !== null && name[1] !== skillName) reportError(`${skillName}: frontmatter name must match its directory name`)
  if (name !== null && name[1].length > 64) reportError(`${skillName}: name must be 64 characters or fewer`)
  if (description === null || description[1].trim().length === 0) reportError(`${skillName}: frontmatter requires a non-empty description`)
  if (content.includes('TODO') || content.includes('<placeholder>')) reportError(`${skillName}: remove unfinished placeholders before committing`)

  if (!existsSync(metadataPath)) {
    reportError(`${skillName}: missing agents/openai.yaml UI metadata`)
    return
  }

  const metadata = readFileSync(metadataPath, 'utf8')
  const displayName = metadata.match(/^\s{2}display_name:\s*"([^"\n]+)"\s*$/m)
  const shortDescription = metadata.match(/^\s{2}short_description:\s*"([^"\n]+)"\s*$/m)
  const defaultPrompt = metadata.match(/^\s{2}default_prompt:\s*"([^"\n]+)"\s*$/m)
  const implicitInvocation = metadata.match(/^\s{2}allow_implicit_invocation:\s*(true|false)\s*$/m)

  if (displayName === null) reportError(`${skillName}: UI metadata requires a quoted interface.display_name`)
  if (shortDescription === null) reportError(`${skillName}: UI metadata requires a quoted interface.short_description`)
  if (defaultPrompt === null || !defaultPrompt[1].includes(`$${skillName}`)) {
    reportError(`${skillName}: UI metadata default_prompt must mention $${skillName}`)
  }
  if (implicitInvocation === null || implicitInvocation[1] !== 'true') {
    reportError(`${skillName}: UI metadata must keep policy.allow_implicit_invocation true`)
  }

  for (const requiredReference of requiredSkillReferences.get(skillName) ?? []) {
    if (!content.includes(requiredReference)) {
      reportError(`${skillName}: SKILL.md must route to ${requiredReference}`)
    }
  }
}

function validateGovernanceDocuments(skillNames) {
  const knownSkillNames = new Set(skillNames)

  for (const documentPath of governanceDocumentPaths) {
    if (!existsSync(documentPath)) {
      reportError(`${documentPath}: missing AI governance document`)
      continue
    }

    const content = readFileSync(documentPath, 'utf8')
    for (const requiredSkillName of requiredSkillNames) {
      if (!content.includes(requiredSkillName)) {
        reportError(`${documentPath}: must reference required Skill ${requiredSkillName}`)
      }
    }

    for (const referencedSkillName of content.match(/learning-web-[a-z0-9-]+/g) ?? []) {
      if (!knownSkillNames.has(referencedSkillName)) {
        reportError(`${documentPath}: references unknown Skill ${referencedSkillName}`)
      }
    }
  }
}

if (!existsSync(skillsDirectory)) {
  reportError('Missing .agents/skills directory')
} else {
  const skillDirectories = readdirSync(skillsDirectory, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)

  if (skillDirectories.length === 0) reportError('.agents/skills must contain at least one skill')
  for (const requiredSkillName of requiredSkillNames) {
    if (!skillDirectories.includes(requiredSkillName)) reportError(`Missing required Skill directory: ${requiredSkillName}`)
  }
  for (const skillName of skillDirectories) validateSkill(skillName)
  validateGovernanceDocuments(skillDirectories)
}

if (errors.length > 0) {
  for (const error of errors) console.error(`AI skill validation: ${error}`)
  process.exitCode = 1
}
