#include <limits.h>
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>

/* Optional legacy launcher. The application's native entry selects its profile. */
int main(int argc, char **argv) {
    char current[PATH_MAX], application[PATH_MAX];
    const char *project = argc > 1 ? argv[1] : getenv("YAOTONGXUE_ROOT");
    if (project == NULL || project[0] == '\0') {
        project = getcwd(current, sizeof(current));
        if (project == NULL) { perror("Unable to locate the project"); return 1; }
    }
    if (snprintf(application, sizeof(application), "%s/app/姚同学.app", project) >= (int)sizeof(application)) {
        fputs("Application path is too long.\n", stderr);
        return 1;
    }
    execl("/usr/bin/open", "open", "-n", application, (char *)0);
    perror("Unable to open the application");
    return 1;
}
