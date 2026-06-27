import Foundation

/// Controls batch renaming. The pattern supports the tokens:
///   {original} {number} {date} {prefix} {suffix}
struct RenameSettings: Codable, Equatable {
    var enabled: Bool = true
    var pattern: String = "{original}_watermarked"
    var prefix: String = ""
    var suffix: String = ""
    var startNumber: Int = 1
    /// Zero-padding width for {number}: 3 => 001, 002 ...
    var numberPadding: Int = 3
    var dateFormat: String = "yyyy-MM-dd"

    static let availableTokens = ["{original}", "{number}", "{date}", "{prefix}", "{suffix}"]

    static let examplePatterns = [
        "leveltech_{number}",
        "review_{date}_{number}",
        "{original}_watermarked",
        "{prefix}{original}{suffix}"
    ]
}

/// Builds output base names (without extension) from a `RenameSettings`.
struct FilenameBuilder {
    let settings: RenameSettings
    private let dateString: String

    init(settings: RenameSettings, date: Date = Date()) {
        self.settings = settings
        let fmt = DateFormatter()
        fmt.locale = Locale(identifier: "en_US_POSIX")
        fmt.dateFormat = settings.dateFormat.isEmpty ? "yyyy-MM-dd" : settings.dateFormat
        self.dateString = fmt.string(from: date)
    }

    /// `originalName` is the file name without extension. `index` is 0-based.
    func baseName(original originalName: String, index: Int) -> String {
        guard settings.enabled else { return originalName }

        let number = settings.startNumber + index
        let width = max(0, settings.numberPadding)
        let numberString = String(format: "%0\(width)d", number)

        var result = settings.pattern.isEmpty ? "{original}" : settings.pattern
        result = result.replacingOccurrences(of: "{original}", with: originalName)
        result = result.replacingOccurrences(of: "{number}", with: numberString)
        result = result.replacingOccurrences(of: "{date}", with: dateString)
        result = result.replacingOccurrences(of: "{prefix}", with: settings.prefix)
        result = result.replacingOccurrences(of: "{suffix}", with: settings.suffix)

        return FilenameBuilder.sanitize(result)
    }

    /// Strips characters that are illegal in file names.
    static func sanitize(_ name: String) -> String {
        let illegal = CharacterSet(charactersIn: "/\\:*?\"<>|")
        let cleaned = name.components(separatedBy: illegal).joined(separator: "-")
        return cleaned.isEmpty ? "image" : cleaned
    }
}
