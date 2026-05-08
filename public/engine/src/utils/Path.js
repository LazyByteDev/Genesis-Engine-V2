/**
 * Global engine path management.
 * Uses concatenation: Path.menu + 'bg.png'
 */
class Path {
  // Audio
  static music = "assets/audio/music/";
  static songs = "assets/audio/songs/";
  static sounds = "assets/audio/sounds/";

  // Data
  static dataChars = "assets/data/characters/";
  static dataSkins = "assets/data/skins/";
  static dataUI = "assets/data/ui/";
  static dataStages = "assets/data/stages/";
  static dataWeeks = "assets/data/weeks/";

  // Fonts
  static fonts = "assets/fonts/";

  // Images
  static img = "assets/images/";

  // Characters
  static chars = "assets/images/characters/";
  static charsAtlas = "assets/images/characters/atlas/";
  static charsSpecial = "assets/images/characters/special/";
  static charsXML = "assets/images/characters/xml/";

  // Menu
  static menu = "assets/images/menu/";
  static menuBG = "assets/images/menu/bg/";
  static menuCredits = "assets/images/menu/credits/";
  static menuIntro = "assets/images/menu/intro/";
  static menuMain = "assets/images/menu/mainmenu/";
  static menuOptions = "assets/images/menu/options/";
  static menuStory = "assets/images/menu/storymode/";

  // Misc
  static UI = "assets/images/ui/";
  static skins = "assets/images/skins/";
  static stages = "assets/images/stages/";

  /**
   * @param {string} path - Base path
   * @param {string} file - File to concatenate
   * @returns {string}
   */
  static get(path, file = "") {
    return path + file;
  }
}

window.Path = Path;
