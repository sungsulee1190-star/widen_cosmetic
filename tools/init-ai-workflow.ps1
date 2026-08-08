[CmdletBinding(SupportsShouldProcess = $true)]
param(
    [Parameter(Mandatory = $true)]
    [string]$TargetPath,

    [switch]$Force
)

$ErrorActionPreference = 'Stop'
$sourceRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$targetRoot = [System.IO.Path]::GetFullPath($TargetPath)

if (-not (Test-Path -LiteralPath $targetRoot)) {
    if ($PSCmdlet.ShouldProcess($targetRoot, 'Create target directory')) {
        New-Item -ItemType Directory -Path $targetRoot -Force | Out-Null
    }
}

$copyPlan = @(
    @{ Source = 'templates/ai-workflow/AGENTS.md'; Destination = 'AGENTS.md' },
    @{ Source = 'templates/ai-workflow/docs/ai/README.md'; Destination = 'docs/ai/README.md' },
    @{ Source = 'templates/ai-workflow/docs/ai/WORKFLOW.md'; Destination = 'docs/ai/WORKFLOW.md' },
    @{ Source = 'templates/ai-workflow/docs/ai/model-routing.md'; Destination = 'docs/ai/model-routing.md' },
    @{ Source = 'templates/ai-workflow/docs/ai/project.yaml'; Destination = 'docs/ai/project.yaml.example' },
    @{ Source = 'docs/ai/templates'; Destination = 'docs/ai/templates' }
)

foreach ($item in $copyPlan) {
    $source = Join-Path $sourceRoot $item.Source
    $destination = Join-Path $targetRoot $item.Destination
    $parent = Split-Path -Parent $destination

    if (-not (Test-Path -LiteralPath $source)) {
        throw "Template source is missing: $source"
    }

    if ((Test-Path -LiteralPath $destination) -and -not $Force) {
        Write-Output "SKIP $($item.Destination) (already exists; use -Force to replace)"
        continue
    }

    if ($PSCmdlet.ShouldProcess($destination, 'Copy AI Work OS template')) {
        New-Item -ItemType Directory -Path $parent -Force | Out-Null
        Copy-Item -LiteralPath $source -Destination $destination -Recurse -Force
        Write-Output "COPIED $($item.Destination)"
    }
}

$projectFile = Join-Path $targetRoot 'docs/ai/project.yaml'
if (-not (Test-Path -LiteralPath $projectFile)) {
    $example = Join-Path $targetRoot 'docs/ai/project.yaml.example'
    if (Test-Path -LiteralPath $example) {
        Copy-Item -LiteralPath $example -Destination $projectFile
        Write-Output 'CREATED docs/ai/project.yaml from example; edit project-specific values.'
    }
}

Write-Output "AI Work OS initialized at $targetRoot"
