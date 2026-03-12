module.exports = {
  content: ['index.html', './src/**/*.{ts,tsx}'],
  safelist: [
    'demo1',
    'hidden',
    'ki-filled',
    'ki-outline',
    'ki-duotone',
    'ki-solid',
    { pattern: /^apexcharts-.*$/ },
    { pattern: /^leaflet-.*$/ }
  ],
  darkMode: 'class',
  theme: {
    extend: {
      base: {
        colors: {
          gray: {
            light: {
              100: '#F9F9F9',
              200: '#F1F1F4',
              300: '#DBDFE9',
              400: '#C4CADA',
              500: '#99A1B7',
              600: '#78829D',
              700: '#4B5675',
              800: '#252F4A',
              900: '#071437'
            },
            dark: {
              100: '#1B1C22',
              200: '#26272F',
              300: '#363843',
              400: '#464852',
              500: '#636674',
              600: '#808290',
              700: '#9A9CAE',
              800: '#B5B7C8',
              900: '#F5F5F5'
            }
          },
          contextual: {
            light: {
              brand: {
                default: '#f2f4f7',
                active: '#F15700',
                light: '#FFF5EF',
                clarity: 'rgba(255, 111, 30, 0.20)',
                inverse: '#ffffff'
              },
              primary: {
                default: '#8AB4F8',
                active: '#8AB4F8',
                light: '#EFF6FF',
                clarity: 'rgba(27, 132, 255, 0.20)',
                inverse: '#ffffff'
              },
              success: {
                default: '#17C653',
                active: '#04B440',
                light: '#EAFFF1',
                clarity: 'rgba(23, 198, 83, 0.20)',
                inverse: '#ffffff'
              },
              info: {
                default: '#7239EA',
                active: '#5014D0',
                light: '#F8F5FF',
                clarity: 'rgba(114, 57, 234, 0.20)',
                inverse: '#ffffff'
              },
              danger: {
                default: '#F8285A',
                active: '#D81A48',
                light: '#FFEEF3',
                clarity: 'rgba(248, 40, 90, 0.20)',
                inverse: '#ffffff'
              },
              warning: {
                default: '#F6B100',
                active: '#DFA000',
                light: '#FFF8DD',
                clarity: 'rgba(246, 177, 0, 0.20)',
                inverse: '#ffffff'
              },
              dark: {
                default: '#1b1b1b',
                active: '#2a2a2a',
                light: '#3a3a3a',
                clarity: 'rgba(255, 255, 255, 0.05)',
                inverse: '#ffffff'
              },
              light: {
                default: '#FAFAFA',
                active: '#eaeef3',
                light: '#ffffff',
                clarity: 'rgba(242, 244, 247, 0.20)',
                inverse: '#4B5675'
              },
              secondary: {
                default: '#F9F9F9',
                active: '#F9F9F9',
                light: '#F9F9F9',
                clarity: 'rgba(249, 249, 249, 0.20)',
                inverse: '#4B5675'
              }
            },
            dark: {
              brand: {
                default: '#8AB4F8',
                active: '#AECBFA',
                light: '#1b1b1b',
                clarity: 'rgba(138, 180, 248, 0.20)',
                inverse: '#ffffff'
              },
              primary: {
                default: '#8AB4F8',
                active: '#AECBFA',
                light: '#1b1b1b',
                clarity: 'rgba(138, 180, 248, 0.20)',
                inverse: '#ffffff'
              },
              success: {
                default: '#81C995',
                active: '#A5D6A7',
                light: '#1b1b1b',
                clarity: 'rgba(129, 201, 149, 0.20)',
                inverse: '#ffffff'
              },
              info: {
                default: '#8AB4F8',
                active: '#AECBFA',
                light: '#1b1b1b',
                clarity: 'rgba(138, 180, 248, 0.20)',
                inverse: '#ffffff'
              },
              danger: {
                default: '#F28B82',
                active: '#FFB3AC',
                light: '#1b1b1b',
                clarity: 'rgba(242, 139, 130, 0.20)',
                inverse: '#ffffff'
              },
              warning: {
                default: '#FDD663',
                active: '#FFE082',
                light: '#1b1b1b',
                clarity: 'rgba(253, 214, 99, 0.20)',
                inverse: '#ffffff'
              },
              dark: {
                default: '#1b1b1b',
                active: '#2a2a2a',
                light: '#121212',
                clarity: 'rgba(27, 27, 27, 0.20)',
                inverse: '#ffffff'
              },
              light: {
                default: '#2a2a2a',
                active: '#3a3a3a',
                light: '#2a2a2a',
                clarity: 'rgba(255, 255, 255, 0.06)',
                inverse: '#E8EAED'
              },
              secondary: {
                default: '#3a3a3a',
                active: '#5f5f5f',
                light: '#3a3a3a',
                clarity: 'rgba(255, 255, 255, 0.04)',
                inverse: '#BDC1C6'
              }
            }
          }
        },
        boxShadows: {
          light: {
            default: '0px 4px 12px 0px rgba(0, 0, 0, 0.09)',
            light: '0px 3px 4px 0px rgba(0, 0, 0, 0.03)',
            primary: '0px 4px 12px 0px rgba(40, 132, 239, 0.35)',
            success: '0px 4px 12px 0px rgba(53, 189, 100, 0.35)',
            danger: '0px 4px 12px 0px rgba(241, 65, 108, 0.35)',
            info: '0px 4px 12px 0px rgba(114, 57, 234, 0.35)',
            warning: '0px 4px 12px 0px rgba(246, 192, 0, 0.35)',
            dark: '0px 4px 12px 0px rgba(37, 47, 74, 0.35)'
          },
          dark: {
            default: 'none',
            light: 'none',
            primary: 'none',
            success: 'none',
            danger: 'none',
            info: 'none',
            warning: 'none',
            dark: 'none'
          }
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif']
      },
      colors: {
        //begin: Shadcn UI Colors
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))'
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))'
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))'
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))'
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))'
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))'
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))'
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          1: 'hsl(var(--chart-1))',
          2: 'hsl(var(--chart-2))',
          3: 'hsl(var(--chart-3))',
          4: 'hsl(var(--chart-4))',
          5: 'hsl(var(--chart-5))'
        },
        //end
        gray: {
          100: 'var(--tw-gray-100)',
          200: 'var(--tw-gray-200)',
          300: 'var(--tw-gray-300)',
          400: 'var(--tw-gray-400)',
          500: 'var(--tw-gray-500)',
          600: 'var(--tw-gray-600)',
          700: 'var(--tw-gray-700)',
          800: 'var(--tw-gray-800)',
          900: 'var(--tw-gray-900)'
        },
        primary: {
          DEFAULT: 'var(--tw-primary)',
          active: 'var(--tw-primary-active)',
          light: 'var(--tw-primary-light)',
          clarity: 'var(--tw-primary-clarity)',
          inverse: 'var(--tw-primary-inverse)',
          foreground: 'hsl(var(--primary-foreground))'
        },
        success: {
          DEFAULT: 'var(--tw-success)',
          active: 'var(--tw-success-active)',
          light: 'var(--tw-success-light)',
          clarity: 'var(--tw-success-clarity)',
          inverse: 'var(--tw-success-inverse)'
        },
        warning: {
          DEFAULT: 'var(--tw-warning)',
          active: 'var(--tw-warning-active)',
          light: 'var(--tw-warning-light)',
          clarity: 'var(--tw-warning-clarity)',
          inverse: 'var(--tw-warning-inverse)'
        },
        danger: {
          DEFAULT: 'var(--tw-danger)',
          active: 'var(--tw-danger-active)',
          light: 'var(--tw-danger-light)',
          clarity: 'var(--tw-danger-clarity)',
          inverse: 'var(--tw-danger-inverse)'
        },
        info: {
          DEFAULT: 'var(--tw-info)',
          active: 'var(--tw-info-active)',
          light: 'var(--tw-info-light)',
          clarity: 'var(--tw-info-clarity)',
          inverse: 'var(--tw-info-inverse)'
        },
        dark: {
          DEFAULT: 'var(--tw-dark)',
          active: 'var(--tw-dark-active)',
          light: 'var(--tw-dark-light)',
          clarity: 'var(--tw-dark-clarity)',
          inverse: 'var(--tw-dark-inverse)'
        },
        secondary: {
          DEFAULT: 'var(--tw-secondary)',
          active: 'var(--tw-secondary-active)',
          light: 'var(--tw-secondary-light)',
          clarity: 'var(--tw-secondary-clarity)',
          inverse: 'var(--tw-secondary-inverse)',
          foreground: 'hsl(var(--secondary-foreground))'
        },
        light: {
          DEFAULT: 'var(--tw-light)',
          active: 'var(--tw-light-active)',
          light: 'var(--tw-light-light)',
          clarity: 'var(--tw-light-clarity)',
          inverse: 'var(--tw-light-inverse)'
        },
        brand: {
          DEFAULT: 'var(--tw-brand)',
          active: 'var(--tw-brand-active)',
          light: 'var(--tw-brand-light)',
          clarity: 'var(--tw-brand-clarity)',
          inverse: 'var(--tw-brand-inverse)'
        },
        coal: {
          100: '#2a2a2a', // más claro
          200: '#252525',
          300: '#212121',
          400: '#1c1c1c',
          500: '#1b1b1b', // valor central (el que quieres)
          600: '#181818', // más oscuro
          black: '#000000',
          clarity: 'rgba(27, 27, 27, 0.50)' // ajustado al nuevo base
        }
      },
      boxShadow: {
        card: 'var(--tw-card-box-shadow)',
        default: 'var(--tw-default-box-shadow)',
        light: 'var(--tw-light-box-shadow)',
        primary: 'var(--tw-primary-box-shadow)',
        success: 'var(--tw-success-box-shadow)',
        danger: 'var(--tw-danger-box-shadow)',
        info: 'var(--tw-info-box-shadow)',
        warning: 'var(--tw-warning-box-shadow)',
        dark: 'var(--tw-dark-box-shadow)'
      },
      fontSize: {
        '4xs': [
          '0.5625rem', // 9px
          {
            lineHeight: '0.6875rem' // 11px
          }
        ],
        '3xs': [
          '0.625rem', // 10px
          {
            lineHeight: '0.75rem' // 12px
          }
        ],
        '2xs': [
          '0.6875rem', // 11px
          {
            lineHeight: '0.75rem' // 12px
          }
        ],
        '2sm': [
          '0.8125rem', // 13px
          {
            lineHeight: '1.125rem' // 18px
          }
        ],
        md: [
          '0.9375rem', // 15px
          {
            lineHeight: '1.375rem' // 22px
          }
        ],
        '1.5xl': [
          '1.375rem', // 22px
          {
            lineHeight: '1.8125rem' // 29px
          }
        ],
        '2.5xl': [
          '1.625rem', // 26px
          {
            lineHeight: '2.125rem' // 34px
          }
        ]
      },
      lineHeight: {
        0: '0', // 0px
        5.5: '1.375rem' // 22px
      },
      zIndex: {
        1: '1',
        5: '5',
        15: '15',
        25: '25'
      },
      borderWidth: {
        3: '3px'
      },
      spacing: {
        0.75: '0.1875rem', // 3px
        1.25: '0.3rem', // 5px
        1.75: '0.4375rem', // 7px
        2.25: '0.563rem', // 9px
        2.75: '0.688rem', // 11px
        4.5: '1.125rem', // 18px
        5.5: '1.375rem', // 22px
        6.5: '1.625rem', // 26px
        7.5: '1.875rem', // 30px
        12.5: '3.125rem' // 40px
      },
      screens: {
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1536px'
      },
      //begin: Shadcn UI Animations
      keyframes: {
        'loading-bar': {
          '0%, 100%': { transform: 'translateX(-100%)' },
          '50%': { transform: 'translateX(100%)' }
        },
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' }
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' }
        },
        'collapsible-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-collapsible-content-height)' }
        },
        'collapsible-up': {
          from: { height: 'var(--radix-collapsible-content-height)' },
          to: { height: 'o' }
        }
      },
      animation: {
        'loading-bar': 'loading-bar 1.5s ease-in-out infinite',
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'collapsible-down': 'collapsible-down 0.2s ease-out',
        'collapsible-up': 'collapsible-up 0.2s ease-out'
      }
      //end
    },
    custom: ({ theme }) => ({
      components: {
        common: {
          backgrounds: {
            light: {
              card: 'white',
              tooltip: theme('colors.coal')['400'],
              popover: 'white',
              modal: 'white',
              drawer: 'white',
              dropdown: 'white',
              backdrop: 'rgba(0, 0, 0, 0.80)',
              tableHead: 'var(--tw-light-active)'
            },
            dark: {
              card: '#1b1b1b',
              tooltip: '#2a2a2a',
              popover: '#2a2a2a',
              modal: '#2a2a2a',
              drawer: '#2a2a2a',
              dropdown: '#2a2a2a',
              backdrop: 'rgba(0, 0, 0, 0.80)',
              tableHead: '#3a3a3a'
            }
          },
          borders: {
            light: {
              card: '1px solid var(--tw-gray-200)',
              table: '1px solid var(--tw-gray-200)',
              dropdown: '1px solid var(--tw-gray-200)',
              popover: '1px solid var(--tw-gray-200)',
              tooltip: '0'
            },
            dark: {
              card: `1px solid ${theme('base.colors.gray.dark')['100']}`,
              table: `1px solid ${theme('base.colors.gray.dark')['100']}`,
              dropdown: `1px solid ${theme('base.colors.gray.dark')['100']}`,
              tooltip: `1px solid ${theme('base.colors.gray.dark')['100']}`,
              popover: `1px solid ${theme('base.colors.gray.dark')['100']}`
            }
          },
          boxShadows: {
            light: {
              card: '0px 3px 6px rgba(0, 0, 0, 0.05)',
              tooltip: '0px 4px 10px rgba(0, 0, 0, 0.08)',
              popover: '0px 4px 10px rgba(0, 0, 0, 0.08)',
              modal: '0px 10px 20px rgba(15, 42, 81, 0.08)',
              drawer: '0px 4px 10px rgba(0, 0, 0, 0.06)',
              dropdown: '0px 8px 20px rgba(0, 0, 0, 0.12)',
              input: '0px 0px 10px rgba(0, 0, 0, 0.10)'
            },
            dark: {
              card: '0px 3px 6px rgba(0, 0, 0, 0.25)',
              tooltip: '0px 4px 10px rgba(0, 0, 0, 0.30)',
              popover: '0px 4px 10px rgba(0, 0, 0, 0.30)',
              modal: '0px 10px 24px rgba(0, 0, 0, 0.40)',
              drawer: '0px 4px 10px rgba(0, 0, 0, 0.25)',
              dropdown: '0px 8px 24px rgba(0, 0, 0, 0.35)',
              input: '0px 0px 8px rgba(255, 255, 255, 0.05)' // brillo leve en inputs
            }
          },
          borderRadius: {
            btn: theme('borderRadius.md'),
            progress: theme('borderRadius.lg'),
            dropdown: theme('borderRadius.xl'),
            badge: theme('borderRadius.DEFAULT'),
            card: theme('borderRadius.xl'),
            tooltip: theme('borderRadius.lg'),
            popover: theme('borderRadius.lg'),
            modal: theme('borderRadius.xl')
          }
        },
        container: {
          fixed: {
            px: {
              DEFAULT: theme('spacing')['6'],
              xl: theme('spacing')['7.5']
            },
            'max-width': theme('screens.xl')
          },
          fluid: {
            px: {
              DEFAULT: theme('spacing')['6'],
              xl: theme('spacing')['7.5']
            }
          }
        },
        btn: {
          xs: {
            height: '1.75rem',
            px: '0.5rem',
            py: '0.35rem',
            gap: '0.25rem',
            fontSize: theme('fontSize.2xs')[0],
            fontWeight: '500',
            iconFontSize: '0.75rem',
            onlyIconFontSize: '1rem'
          },
          sm: {
            height: '2rem',
            px: '0.75rem',
            py: '0.45rem',
            gap: '0.275rem',
            fontSize: theme('fontSize.xs')[0],
            fontWeight: '500',
            iconFontSize: '0.875rem',
            onlyIconFontSize: '1.125rem',
            tabsGap: '0.188rem'
          },
          DEFAULT: {
            height: '2.5rem',
            px: '1rem',
            py: '0.55rem',
            gap: '0.375rem',
            fontSize: theme('fontSize.2sm')[0],
            fontWeight: '500',
            iconFontSize: '1.125rem',
            onlyIconFontSize: '1.5rem',
            tabsGap: '0.25rem'
          },
          lg: {
            height: '3rem',
            px: '1.25rem',
            py: '0.75rem',
            gap: '0.5rem',
            fontSize: theme('fontSize.sm')[0],
            fontWeight: '500',
            iconFontSize: '1.25rem',
            onlyIconFontSize: '1.75rem',
            tabsGap: '0.313rem'
          }
        },
        input: {
          sm: {
            px: '0.625rem'
          },
          DEFAULT: {
            px: '0.75rem'
          },
          lg: {
            gap: '0.875rem'
          }
        },
        checkbox: {
          sm: {
            size: '1.125rem',
            borderRadius: '0.25rem'
          },
          DEFAULT: {
            size: '1.375rem',
            borderRadius: '0.375rem'
          },
          lg: {
            size: '1.625rem',
            borderRadius: '0.5rem'
          }
        },
        radio: {
          sm: {
            size: '1.125rem'
          },
          DEFAULT: {
            size: '1.375rem'
          },
          lg: {
            size: '1.625rem'
          }
        },
        switch: {
          sm: {
            height: '1.125rem',
            width: '1.875rem'
          },
          DEFAULT: {
            height: '1.375rem',
            width: '2.125rem'
          },
          lg: {
            height: '1.625rem',
            width: '2.375rem'
          }
        },
        card: {
          px: theme('spacing')['7.5'],
          py: {
            header: theme('spacing.3'),
            body: theme('spacing.5'),
            footer: theme('spacing.3'),
            group: theme('spacing.3')
          },
          grid: {
            px: theme('spacing.5')
          }
        },
        table: {
          px: {
            xs: '0.5rem',
            sm: '0.75rem',
            DEFAULT: '1rem',
            lg: '1.25rem'
          },
          py: {
            xs: {
              head: '0.225rem',
              body: '0.35rem'
            },
            sm: {
              head: '0.425rem',
              body: '0.5rem'
            },
            DEFAULT: {
              head: '0.625rem',
              body: '0.75rem'
            },
            lg: {
              head: '0.825rem',
              body: '0.95rem'
            }
          }
        }
      },
      layouts: {
        demo1: {
          sidebar: {
            width: {
              desktop: '320px',
              desktopCollapse: '100px',
              mobile: '280px'
            }
          },
          header: {
            height: {
              desktop: '80px',
              mobile: '60px'
            }
          }
        }
      }
    })
  },
  plugins: [
    require('tailwindcss-animate'),
    require('./src/plugins/plugin'),
    require('./src/plugins/components/theme'),
    require('./src/plugins/components/breakpoints'),
    require('./src/plugins/components/typography'),
    require('./src/plugins/components/menu'),
    require('./src/plugins/components/dropdown'),
    require('./src/plugins/components/accordion'),
    require('./src/plugins/components/input'),
    require('./src/plugins/components/input-group'),
    require('./src/plugins/components/select'),
    require('./src/plugins/components/textarea'),
    require('./src/plugins/components/file-input'),
    require('./src/plugins/components/switch'),
    require('./src/plugins/components/checkbox'),
    require('./src/plugins/components/radio'),
    require('./src/plugins/components/range'),
    require('./src/plugins/components/container'),
    require('./src/plugins/components/image-input'),
    require('./src/plugins/components/modal'),
    require('./src/plugins/components/drawer'),
    require('./src/plugins/components/tooltip'),
    require('./src/plugins/components/popover'),
    require('./src/plugins/components/btn'),
    require('./src/plugins/components/btn-group'),
    require('./src/plugins/components/tabs'),
    require('./src/plugins/components/pagination'),
    require('./src/plugins/components/card'),
    require('./src/plugins/components/table'),
    require('./src/plugins/components/badge'),
    require('./src/plugins/components/rating'),
    require('./src/plugins/components/scrollable'),
    require('./src/plugins/components/progress'),
    require('./src/plugins/components/apexcharts'),
    require('./src/plugins/components/leaflet')
  ]
};
