/**
 * Story Configuration
 * Simplified to Day and Night only.
 */

export const STORY_CONFIG = {
    settings: {
        debug: false,
        scrollSpeed: 1,
        transitionDuration: 2,
    },
    tropicalAssets: [], // Temporarily removed as requested
    parts: [
        {
            id: 'day',
            title: 'Hành Trình của Huyền dê',
            subtitle: 'THE JOURNEY BEGINS',
            content: 'Bắt đầu cuộc hành trình dưới ánh mặt trời rực rỡ, nơi mọi ý tưởng nảy mầm.',
            theme: {
                backgroundColor: '#ffe0b2', // Warm morning sky
                primaryColor: '#ef6c00',    
                secondaryColor: '#1a1a1a',
                fogColor: '#ffe0b2',
                celestial: { type: 'sun', color: '#ffb703', pos: { x: -15, y: 4, z: -60 }, scale: 8.5 }
            },
            scene: {
                cameraPos: { x: 0, y: 0, z: 12 },
                progress: 0 
            }
        },
        {
            id: 'night',
            title: 'Hành Trình của Huyền xinh',
            subtitle: 'REFLECTIONS IN THE DARK',
            content: 'Khi màn đêm buông xuống, là lúc suy ngẫm và chuẩn bị cho những bước tiến lớn tiếp theo.',
            theme: {
                backgroundColor: '#1a237e', // Deep Indigo Night
                primaryColor: '#82b1ff',    
                secondaryColor: '#ffffff',
                fogColor: '#1a237e',
                celestial: { type: 'moon', color: '#e0e1dd', pos: { x: -10, y: 6, z: -60 }, scale: 5.0 }
            },
            scene: {
                cameraPos: { x: 0, y: 0, z: 12 },
                progress: 1.5 // Start halfway through the 3.0 total range
            }
        }
    ]
};
