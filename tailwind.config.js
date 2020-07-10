module.exports = {
	purge: ["./src/**/*.tsx", "./public/index.html"],
	theme: {
		extend: {
			screens: {
				dark: { raw: "(prefers-color-scheme: dark)" },
			},
		},
	},
	variants: {},
	plugins: [],
};
