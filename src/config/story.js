/**
 * Story Configuration
 * 6 thời điểm trong ngày + 4 mùa
 * Thứ tự: Bình minh → Buổi trưa → Chiều tà → Hoàng hôn → Đêm → Rạng sáng
 * Mùa: Xuân → Hạ → Thu → Đông (lặp lại theo scroll)
 */

export const STORY_CONFIG = {
    settings: {
        debug: false,
        scrollSpeed: 1,
        transitionDuration: 2,
        // Tổng chu kỳ scroll: 6.0 (mỗi giai đoạn 1.0)
        totalCycle: 6.0,
    },
    tropicalAssets: [],

    // 4 Mùa - áp dụng màu sắc cho cây cỏ / terrain tint
    seasons: [{
            id: 'spring',
            name: 'Mùa Xuân',
            groundTint: '#a8d5a2', // xanh lá non
            vegetationColor: '#43a047', // cây xanh tươi
            particleColor: '#f9c5d1', // cánh hoa đào
            hasBlossoms: true,
            hasSnow: false,
            hasLeaves: false,
        },
        {
            id: 'summer',
            name: 'Mùa Hạ',
            groundTint: '#d2b48c', // cát khô vàng
            vegetationColor: '#2e7d32', // xanh đậm
            particleColor: '#ffeb3b', // bụi nắng
            hasBlossoms: false,
            hasSnow: false,
            hasLeaves: false,
        },
        {
            id: 'autumn',
            name: 'Mùa Thu',
            groundTint: '#c49a6c', // đất khô
            vegetationColor: '#e65100', // lá đỏ cam
            particleColor: '#ff8f00', // lá vàng rơi
            hasBlossoms: false,
            hasSnow: false,
            hasLeaves: true,
        },
        {
            id: 'winter',
            name: 'Mùa Đông',
            groundTint: '#e0e0e0', // tuyết trắng
            vegetationColor: '#546e7a', // cây trụi lá
            particleColor: '#ffffff', // tuyết rơi
            hasBlossoms: false,
            hasSnow: true,
            hasLeaves: false,
        },
    ],

    parts: [
        // ─── GIAI ĐOẠN 0: BÌNH MINH (Sáng sớm) ───
        {
            id: 'dawn',
            title: 'Bình Minh – Khởi Hành',
            subtitle: 'THE GOLDEN DAWN',
            content: 'Ánh bình minh đầu tiên chạm đất, nơi mọi cuộc hành trình bắt đầu từ một bước nhỏ đầy hy vọng.',
            timeLabel: '05:30 AM',
            theme: {
                backgroundColor: '#ff9a5c', // Cam đỏ bình minh
                primaryColor: '#ff6f00',
                secondaryColor: '#1a1a1a',
                fogColor: '#ff9a5c',
                ambientColor: '#ff8c69',
                ambientIntensity: 0.5,
                dirLightColor: '#ffcc80',
                dirLightIntensity: 0.8,
                dirLightPos: {
                    x: -40,
                    y: 3,
                    z: -20
                }, // Mặt trời mọc phía Đông thấp
                celestial: {
                    type: 'sun',
                    color: '#ff6b35',
                    glowColor: '#ff9a5c',
                    pos: {
                        x: -130,
                        y: 4,
                        z: -60
                    },
                    scale: 7.0
                }
            },
            scene: {
                cameraPos: {
                    x: 0,
                    y: 0,
                    z: 12
                },
                progress: 0
            }
        },

        // ─── GIAI ĐOẠN 1: BUỔI SÁNG (Sáng) ───
        {
            id: 'morning',
            title: 'Buổi Sáng – Ánh Nắng Chan Hoà',
            subtitle: 'BRIGHT MORNING',
            content: 'Nắng sáng trải dài trên con đường đất đỏ. Chim hót líu lo, muôn hoa khoe sắc.',
            timeLabel: '08:00 AM',
            theme: {
                backgroundColor: '#87ceeb', // Xanh trời sáng
                primaryColor: '#0288d1',
                secondaryColor: '#1a1a1a',
                fogColor: '#b0e0ff',
                ambientColor: '#fff9e6',
                ambientIntensity: 0.6,
                dirLightColor: '#fff9e6',
                dirLightIntensity: 2.0,
                dirLightPos: {
                    x: -20,
                    y: 15,
                    z: 10
                },
                celestial: {
                    type: 'sun',
                    color: '#ffb703',
                    glowColor: '#ffe566',
                    pos: {
                        x: -130,
                        y: 4,
                        z: -60
                    },
                    scale: 8.5
                }
            },
            scene: {
                cameraPos: {
                    x: 0,
                    y: 0,
                    z: 12
                },
                progress: 1.0
            }
        },

        // ─── GIAI ĐOẠN 2: BUỔI TRƯA (Noon) ───
        {
            id: 'noon',
            title: 'Buổi Trưa – Nắng Đứng Bóng',
            subtitle: 'BLAZING NOON',
            content: 'Mặt trời đứng bóng, nắng chang chang. Không khí rung rinh trong cái nóng của miền hoang mạc.',
            timeLabel: '12:00 PM',
            theme: {
                backgroundColor: '#d4e8ff', // Xanh trắng rực rỡ
                primaryColor: '#ff8f00',
                secondaryColor: '#1a1a1a',
                fogColor: '#e8f4ff',
                ambientColor: '#ffffff',
                ambientIntensity: 0.9,
                dirLightColor: '#ffffff',
                dirLightIntensity: 3.5,
                dirLightPos: {
                    x: 0,
                    y: 50,
                    z: 0
                }, // Mặt trời đỉnh đầu
                celestial: {
                    type: 'sun',
                    color: '#fff176',
                    glowColor: '#ffee58',
                    pos: {
                        x: -130,
                        y: 4,
                        z: -60
                    },
                    scale: 10.0
                }
            },
            scene: {
                cameraPos: {
                    x: 0,
                    y: 0,
                    z: 12
                },
                progress: 2.0
            }
        },

        // ─── GIAI ĐOẠN 3: CHIỀU TÀ (Afternoon) ───
        {
            id: 'afternoon',
            title: 'Chiều Tà – Hoàng Kim',
            subtitle: 'GOLDEN AFTERNOON',
            content: 'Ánh chiều tà nhuộm vàng trên mọi nóc nhà. Bóng dài kéo lê trên đường bụi đỏ.',
            timeLabel: '04:30 PM',
            theme: {
                backgroundColor: '#ffb347', // Vàng cam chiều
                primaryColor: '#e65100',
                secondaryColor: '#1a1a1a',
                fogColor: '#ffb347',
                ambientColor: '#ffcc80',
                ambientIntensity: 0.5,
                dirLightColor: '#ff8c00',
                dirLightIntensity: 1.5,
                dirLightPos: {
                    x: 30,
                    y: 8,
                    z: -15
                },
                celestial: {
                    type: 'sun',
                    color: '#ff7043',
                    glowColor: '#ff8a65',
                    pos: {
                        x: -130,
                        y: 4,
                        z: -60
                    },
                    scale: 9.5
                }
            },
            scene: {
                cameraPos: {
                    x: 0,
                    y: 0,
                    z: 12
                },
                progress: 3.0
            }
        },

        // ─── GIAI ĐOẠN 4: ĐÊM (Night) ───
        {
            id: 'night',
            title: 'Màn Đêm – Ngàn Sao',
            subtitle: 'REFLECTIONS IN THE DARK',
            content: 'Khi màn đêm buông xuống, ngàn vì sao xuất hiện. Là lúc suy ngẫm và chuẩn bị cho bước tiến lớn tiếp theo.',
            timeLabel: '09:00 PM',
            theme: {
                backgroundColor: '#0d1b2a', // Xanh đen đêm
                primaryColor: '#82b1ff',
                secondaryColor: '#ffffff',
                fogColor: '#0d1b2a',
                ambientColor: '#1a237e',
                ambientIntensity: 0.2,
                dirLightColor: '#c8d8ff',
                dirLightIntensity: 0.3,
                dirLightPos: {
                    x: -10,
                    y: 20,
                    z: -30
                },
                celestial: {
                    type: 'moon',
                    color: '#e0e1dd',
                    glowColor: '#b0c4de',
                    pos: {
                        x: -130,
                        y: 4,
                        z: -60
                    },
                    scale: 5.0
                }
            },
            scene: {
                cameraPos: {
                    x: 0,
                    y: 0,
                    z: 12
                },
                progress: 4.0
            }
        },

        // ─── GIAI ĐOẠN 5: RẠNG SÁNG (Pre-dawn) ───
        {
            id: 'predawn',
            title: 'Rạng Sáng – Lặng Im',
            subtitle: 'THE QUIET HOUR',
            content: 'Khoảnh khắc im lặng trước bình minh. Vạn vật đang ngủ say, chỉ có ngọn gió nhẹ thì thầm.',
            timeLabel: '03:00 AM',
            theme: {
                backgroundColor: '#1a237e', // Xanh chàm sâu
                primaryColor: '#7986cb',
                secondaryColor: '#ffffff',
                fogColor: '#1a237e',
                ambientColor: '#1a237e',
                ambientIntensity: 0.15,
                dirLightColor: '#9fa8da',
                dirLightIntensity: 0.2,
                dirLightPos: {
                    x: -30,
                    y: 10,
                    z: -40
                },
                celestial: {
                    type: 'moon',
                    color: '#c8d8ff',
                    glowColor: '#90a4ae',
                    pos: {
                        x: -130,
                        y: 4,
                        z: -60
                    },
                    scale: 4.5
                }
            },
            scene: {
                cameraPos: {
                    x: 0,
                    y: 0,
                    z: 12
                },
                progress: 5.0
            }
        },
    ]
};