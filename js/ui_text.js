/**
 * UI Text Resources
 * Regions: jp (Japan), global (English/US), kr (Korea)
 * User Preference: Menus/UI should remain in English even when region is changed.
 */
const uiText = {
    jp: {
        nav_timeline: "Timeline",
        nav_explore: "Explore",
        nav_artists: "Artists",
        header_timeline: "Timeline",
        header_explore: "Explore",
        header_artists: "Artists",
        tab_all: "All",
        tab_following: "Following",
        sort_name: "A-Z",
        sort_debut: "Debut",
        empty_timeline_msg: "フォロー中のアーティストのリリースはまだありません。",
        empty_timeline_btn: "Explore Artists",
        settings_title: "Settings",
        settings_region_title: "Region & Language",
        settings_music_app_title: "Default Music App",
        btn_follow: "Follow",
        btn_following: "Following",
        badge_upcoming: "UPCOMING",
        badge_new: "NEW",
        modal_songs: "Songs",
        modal_min: "min"
    },
    global: {
        nav_timeline: "Timeline",
        nav_explore: "Explore",
        nav_artists: "Artists",
        header_timeline: "Timeline",
        header_explore: "Explore",
        header_artists: "Artists",
        tab_all: "All",
        tab_following: "Following",
        sort_name: "A-Z",
        sort_debut: "Debut",
        empty_timeline_msg: "No releases yet from artists you follow.",
        empty_timeline_btn: "Explore Artists",
        settings_title: "Settings",
        settings_region_title: "Region & Language",
        settings_music_app_title: "Default Music App",
        btn_follow: "Follow",
        btn_following: "Following",
        badge_upcoming: "UPCOMING",
        badge_new: "NEW",
        modal_songs: "Songs",
        modal_min: "min"
    },
    kr: {
        nav_timeline: "Timeline",
        nav_explore: "Explore",
        nav_artists: "Artists",
        header_timeline: "Timeline",
        header_explore: "Explore",
        header_artists: "Artists",
        tab_all: "All",
        tab_following: "Following",
        sort_name: "A-Z",
        sort_debut: "Debut",
        empty_timeline_msg: "팔로우한 아티스트의 새 릴리스가 없습니다.",
        empty_timeline_btn: "Explore Artists",
        settings_title: "Settings",
        settings_region_title: "국가 및 언어", // Keep localized for setting understanding
        settings_music_app_title: "기본 음악 앱", // Keep localized
        btn_follow: "Follow",
        btn_following: "Following",
        badge_upcoming: "UPCOMING",
        badge_new: "NEW",
        modal_songs: "Songs",
        modal_min: "min"
    }
};

window.uiText = uiText;
