"use strict";
// Detects whether BridgePreflight is running in a CI environment.
// Supports major CI providers and generic CI flag.
Object.defineProperty(exports, "__esModule", { value: true });
exports.isCI = isCI;
function isCI() {
    const env = process.env;
    return Boolean(env.CI ||
        env.GITHUB_ACTIONS ||
        env.GITLAB_CI ||
        env.BITBUCKET_BUILD_NUMBER ||
        env.CIRCLECI ||
        env.BUILDKITE ||
        env.TRAVIS ||
        env.TEAMCITY_VERSION ||
        env.AZURE_HTTP_USER_AGENT ||
        env.JENKINS_URL);
}
