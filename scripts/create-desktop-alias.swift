import Foundation

// Write a Finder alias file without involving Finder or the application UI.
guard CommandLine.arguments.count == 3 else {
    fatalError("Usage: create-desktop-alias.swift TARGET_APP ALIAS_FILE")
}
let target = URL(fileURLWithPath: CommandLine.arguments[1]).standardizedFileURL
let alias = URL(fileURLWithPath: CommandLine.arguments[2]).standardizedFileURL
guard FileManager.default.fileExists(atPath: target.path),
      !FileManager.default.fileExists(atPath: alias.path) else {
    fatalError("Target must exist and alias destination must not exist")
}
let bookmark = try target.bookmarkData(options: .suitableForBookmarkFile,
                                     includingResourceValuesForKeys: nil,
                                     relativeTo: nil)
try URL.writeBookmarkData(bookmark, to: alias)
let values = try alias.resourceValues(forKeys: [.isAliasFileKey])
guard values.isAliasFile == true else { fatalError("Output is not a Finder alias") }
let resolved = try URL(resolvingAliasFileAt: alias, options: [.withoutUI, .withoutMounting])
guard resolved.standardizedFileURL == target else { fatalError("Alias target differs") }
print(resolved.path)
