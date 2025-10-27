module.exports = {
  forbidden: [
    { name: "no-circular", severity: "error", from: {}, to: { circular: true } },
    { name: "no-packages-to-services", severity: "error",
      from: { path: "^packages/[^/]+/src" },
      to:   { path: "^services/" } },
    { name: "no-packages-to-apps", severity: "error",
      from: { path: "^packages/[^/]+/src" },
      to:   { path: "^apps/" } },
    { name: "no-backwards", severity: "error",
      from: { path: "^(packages/types|packages/trading-core|packages/strategy-codegen|services/executor)/" },
      to:   { path: "packages/types", pathNot: "^(packages/types)/" } }
  ]
}; 