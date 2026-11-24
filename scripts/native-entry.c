/* One macOS app entry, with the local profile selected before Electron starts. */
#include <errno.h>
#include <limits.h>
#include <mach-o/dyld.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>

static int parent_directory(char *path) {
    char *slash = strrchr(path, '/');
    if (slash == NULL || slash == path) return -1;
    *slash = '\0';
    return 0;
}

int main(int argc, char **argv) {
    char executable[PATH_MAX], resolved[PATH_MAX], directory[PATH_MAX];
    char project[PATH_MAX], runtime[PATH_MAX], codex_home[PATH_MAX];
    char user_data[PATH_MAX], user_data_argument[PATH_MAX + 32];
    uint32_t executable_size = sizeof(executable);
    if (_NSGetExecutablePath(executable, &executable_size) != 0 ||
        realpath(executable, resolved) == NULL) {
        fputs("Unable to locate the application entry.\n", stderr);
        return 1;
    }
    memcpy(directory, resolved, strlen(resolved) + 1);
    if (parent_directory(directory) != 0) return 1;
    memcpy(project, directory, strlen(directory) + 1);
    /* MacOS -> Contents -> application bundle -> app -> project. */
    for (int i = 0; i < 4; i++) {
        if (parent_directory(project) != 0) return 1;
    }
    if (snprintf(runtime, sizeof(runtime), "%s/ChatGPT", directory) >= (int)sizeof(runtime) ||
        snprintf(codex_home, sizeof(codex_home), "%s/state/codex-home", project) >= (int)sizeof(codex_home) ||
        snprintf(user_data, sizeof(user_data), "%s/state/user-data", project) >= (int)sizeof(user_data) ||
        snprintf(user_data_argument, sizeof(user_data_argument), "--user-data-dir=%s", user_data) >= (int)sizeof(user_data_argument)) {
        fputs("Application profile path is too long.\n", stderr);
        return 1;
    }
    if (setenv("CODEX_HOME", codex_home, 1) != 0 ||
        setenv("CODEX_ELECTRON_USER_DATA_PATH", user_data, 1) != 0) {
        perror("Unable to select the application profile");
        return 1;
    }
    int has_user_data_argument = 0;
    for (int i = 1; i < argc; i++) {
        if (strcmp(argv[i], "--user-data-dir") == 0 ||
            strncmp(argv[i], "--user-data-dir=", 16) == 0) {
            has_user_data_argument = 1;
        }
    }
    char **runtime_arguments = calloc((size_t)argc + 2, sizeof(char *));
    if (runtime_arguments == NULL) {
        perror("Unable to prepare the application launch");
        return 1;
    }
    runtime_arguments[0] = runtime;
    for (int i = 1; i < argc; i++) runtime_arguments[i] = argv[i];
    if (!has_user_data_argument) runtime_arguments[argc] = user_data_argument;
    execv(runtime, runtime_arguments);
    perror("Unable to start the application runtime");
    free(runtime_arguments);
    return 1;
}
