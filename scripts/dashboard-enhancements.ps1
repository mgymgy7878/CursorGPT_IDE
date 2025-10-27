# Dashboard Hızlı Ekler - Grafana Panel Enhancements
param(
    [string]$DashboardFile = "config/grafana/dashboards/spark-runner-dashboard.json",
    [string]$OutputFile = "config/grafana/dashboards/spark-runner-enhanced-dashboard.json",
    [switch]$DryRun = $false
)

$ErrorActionPreference = "Continue"

function Add-ConfidenceScorePanel {
    param([object]$Dashboard)
    
    $confidencePanel = @{
        id = 7
        title = "Confidence Score"
        type = "stat"
        targets = @(
            @{
                expr = "spark_runner_confidence_score{type=`"threshold`"}"
                legendFormat = "Confidence Score"
            }
        )
        fieldConfig = @{
            defaults = @{
                color = @{
                    mode = "thresholds"
                }
                thresholds = @{
                    steps = @(
                        @{ color = "red"; value = $null }
                        @{ color = "yellow"; value = 0.5 }
                        @{ color = "green"; value = 0.8 }
                    )
                }
                unit = "short"
                decimals = 3
            }
        }
        gridPos = @{
            h = 8
            w = 12
            x = 0
            y = 0
        }
        options = @{
            colorMode = "value"
            graphMode = "area"
            justifyMode = "auto"
            orientation = "auto"
            reduceOptions = @{
                values = $false
                calcs = @("lastNotNull")
                fields = ""
            }
            textMode = "auto"
        }
    }
    
    $Dashboard.panels += $confidencePanel
    return $Dashboard
}

function Add-ThresholdDriftPanel {
    param([object]$Dashboard)
    
    $driftPanel = @{
        id = 8
        title = "Threshold Drift"
        type = "timeseries"
        targets = @(
            @{
                expr = "spark_runner_threshold_drift{threshold_type=`"fast_burn`"}"
                legendFormat = "Fast Burn Drift"
            },
            @{
                expr = "spark_runner_threshold_drift{threshold_type=`"slow_burn`"}"
                legendFormat = "Slow Burn Drift"
            }
        )
        fieldConfig = @{
            defaults = @{
                color = @{
                    mode = "palette-classic"
                }
                custom = @{
                    axisLabel = ""
                    axisPlacement = "auto"
                    barAlignment = 0
                    drawStyle = "line"
                    fillOpacity = 0
                    gradientMode = "none"
                    hideFrom = @{
                        legend = $false
                        tooltip = $false
                        vis = $false
                    }
                    lineInterpolation = "linear"
                    lineWidth = 1
                    pointSize = 5
                    scaleDistribution = @{
                        type = "linear"
                    }
                    showPoints = "auto"
                    spanNulls = $false
                    stacking = @{
                        group = "A"
                        mode = "none"
                    }
                    thresholdsStyle = @{
                        mode = "off"
                    }
                }
                mappings = @()
                thresholds = @{
                    mode = "absolute"
                    steps = @(
                        @{ color = "green"; value = $null }
                        @{ color = "red"; value = 0.1 }
                    )
                }
                unit = "short"
            }
        }
        gridPos = @{
            h = 8
            w = 12
            x = 12
            y = 0
        }
        options = @{
            legend = @{
                calcs = @()
                displayMode = "list"
                placement = "bottom"
                showLegend = $true
            }
            tooltip = @{
                mode = "single"
                sort = "none"
            }
        }
    }
    
    $Dashboard.panels += $driftPanel
    return $Dashboard
}

function Add-PredictiveAlertsPanel {
    param([object]$Dashboard)
    
    $predictivePanel = @{
        id = 9
        title = "Predictive Alerts"
        type = "timeseries"
        targets = @(
            @{
                expr = "increase(spark_runner_predictive_alerts_total[24h])"
                legendFormat = "{{alert_type}} ({{confidence_level}})"
            }
        )
        fieldConfig = @{
            defaults = @{
                color = @{
                    mode = "palette-classic"
                }
                custom = @{
                    axisLabel = ""
                    axisPlacement = "auto"
                    barAlignment = 0
                    drawStyle = "line"
                    fillOpacity = 0
                    gradientMode = "none"
                    hideFrom = @{
                        legend = $false
                        tooltip = $false
                        vis = $false
                    }
                    lineInterpolation = "linear"
                    lineWidth = 1
                    pointSize = 5
                    scaleDistribution = @{
                        type = "linear"
                    }
                    showPoints = "auto"
                    spanNulls = $false
                    stacking = @{
                        group = "A"
                        mode = "none"
                    }
                    thresholdsStyle = @{
                        mode = "off"
                    }
                }
                mappings = @()
                thresholds = @{
                    mode = "absolute"
                    steps = @(
                        @{ color = "green"; value = $null }
                        @{ color = "yellow"; value = 1 }
                        @{ color = "red"; value = 5 }
                    )
                }
                unit = "short"
            }
        }
        gridPos = @{
            h = 8
            w = 12
            x = 0
            y = 8
        }
        options = @{
            legend = @{
                calcs = @()
                displayMode = "list"
                placement = "bottom"
                showLegend = $true
            }
            tooltip = @{
                mode = "single"
                sort = "none"
            }
        }
    }
    
    $Dashboard.panels += $predictivePanel
    return $Dashboard
}

function Add-RootCauseFacetPanel {
    param([object]$Dashboard)
    
    $rootCausePanel = @{
        id = 10
        title = "Root-Cause Facet Analysis"
        type = "table"
        targets = @(
            @{
                expr = "sum by (root_cause, environment, host, command_type) (increase(spark_runner_stalls_total[24h]))"
                format = "table"
                instant = $true
            }
        )
        fieldConfig = @{
            defaults = @{
                color = @{
                    mode = "thresholds"
                }
                custom = @{
                    align = "auto"
                    cellOptions = @{
                        type = "auto"
                    }
                    displayMode = "auto"
                    filterable = $true
                    inspect = $false
                }
                mappings = @()
                thresholds = @{
                    mode = "absolute"
                    steps = @(
                        @{ color = "green"; value = $null }
                        @{ color = "yellow"; value = 1 }
                        @{ color = "red"; value = 5 }
                    )
                }
            }
            overrides = @()
        }
        gridPos = @{
            h = 8
            w = 24
            x = 12
            y = 8
        }
        options = @{
            showHeader = $true
            sortBy = @(
                @{
                    desc = $true
                    displayName = "Value"
                }
            )
        }
        transformations = @(
            @{
                id = "organize"
                options = @{
                    excludeByName = @{}
                    indexByName = @{}
                    renameByName = @{
                        "Value" = "Stall Count"
                        "root_cause" = "Root Cause"
                        "environment" = "Environment"
                        "host" = "Host"
                        "command_type" = "Command Type"
                    }
                }
            }
        )
    }
    
    $Dashboard.panels += $rootCausePanel
    return $Dashboard
}

function Add-EnhancedAnnotations {
    param([object]$Dashboard)
    
    # Add confidence score annotations
    $confidenceAnnotation = @{
        name = "Confidence Score Changes"
        enable = $true
        datasource = "prometheus"
        expr = "spark_runner_confidence_score{type=`"threshold`"}"
        iconColor = "blue"
        titleFormat = "Confidence: {{value}}"
    }
    
    # Add threshold drift annotations
    $driftAnnotation = @{
        name = "Threshold Drift Events"
        enable = $true
        datasource = "prometheus"
        expr = "spark_runner_threshold_drift"
        iconColor = "orange"
        titleFormat = "Drift: {{value}}"
    }
    
    # Add predictive alert annotations
    $predictiveAnnotation = @{
        name = "Predictive Alerts"
        enable = $true
        datasource = "prometheus"
        expr = "increase(spark_runner_predictive_alerts_total[1m]) > 0"
        iconColor = "red"
        titleFormat = "Predictive Alert: {{value}}"
    }
    
    $Dashboard.annotations.list += $confidenceAnnotation
    $Dashboard.annotations.list += $driftAnnotation
    $Dashboard.annotations.list += $predictiveAnnotation
    
    return $Dashboard
}

function Generate-EnhancedDashboard {
    param([string]$InputFile, [string]$OutputFile)
    
    if (-not (Test-Path $InputFile)) {
        Write-Host "❌ Input dashboard file not found: $InputFile" -ForegroundColor Red
        return $false
    }
    
    try {
        # Load existing dashboard
        $dashboard = Get-Content $InputFile -Raw | ConvertFrom-Json
        
        # Add enhanced panels
        $dashboard = Add-ConfidenceScorePanel -Dashboard $dashboard
        $dashboard = Add-ThresholdDriftPanel -Dashboard $dashboard
        $dashboard = Add-PredictiveAlertsPanel -Dashboard $dashboard
        $dashboard = Add-RootCauseFacetPanel -Dashboard $dashboard
        
        # Add enhanced annotations
        $dashboard = Add-EnhancedAnnotations -Dashboard $dashboard
        
        # Update dashboard metadata
        $dashboard.title = "Spark Runner Watchdog - Enhanced"
        $dashboard.description = "Enhanced dashboard with confidence scoring, threshold drift, predictive alerts, and root-cause facet analysis"
        $dashboard.tags = @("runner", "watchdog", "autonomous", "neural", "predictive")
        
        # Save enhanced dashboard
        $dashboard | ConvertTo-Json -Depth 10 | Out-File $OutputFile -Encoding UTF8
        
        Write-Host "✅ Enhanced dashboard saved to: $OutputFile" -ForegroundColor Green
        return $true
    } catch {
        Write-Host "❌ Dashboard enhancement failed: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Main execution
Write-Host "## Dashboard Hızlı Ekler - $(Get-Date)" -ForegroundColor Cyan
Write-Host "Input Dashboard: $DashboardFile" -ForegroundColor Cyan
Write-Host "Output Dashboard: $OutputFile" -ForegroundColor Cyan
Write-Host "Dry run: $DryRun" -ForegroundColor Cyan

if (-not $DryRun) {
    $enhanced = Generate-EnhancedDashboard -InputFile $DashboardFile -OutputFile $OutputFile
    
    if ($enhanced) {
        Write-Host "`nEnhanced Dashboard Features:" -ForegroundColor Green
        Write-Host "  - Confidence Score sparkline" -ForegroundColor White
        Write-Host "  - Threshold Drift band overlay" -ForegroundColor White
        Write-Host "  - Predictive Alerts flow" -ForegroundColor White
        Write-Host "  - Root-Cause Facet analysis" -ForegroundColor White
        Write-Host "  - Enhanced annotations" -ForegroundColor White
    }
} else {
    Write-Host "Dry run mode - dashboard enhancement skipped" -ForegroundColor Yellow
}

# Log dashboard enhancement event
$dashboardEvent = @{
    ts = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ssZ")
    event = "dashboard_enhancement"
    input_file = $DashboardFile
    output_file = $OutputFile
    dry_run = $DryRun
} | ConvertTo-Json

Add-Content -Path "evidence/runner/stall-events.jsonl" -Value $dashboardEvent

Write-Host "`n## Dashboard enhancement completed" -ForegroundColor Green
