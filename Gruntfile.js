/*global module:false*/
module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    banner: '/**\n * @license <%= pkg.title || pkg.name %> v<%= pkg.version %>\n' +
      ' * (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>\n' +
      ' * License: <%= pkg.license %>\n' +
      ' * <%= pkg.homepage %>\n */\n',
    concat: {
      options: {
        banner: '<%= banner %>',
        // remove tsd and jshint annotations
        stripBanners: { block: true, line: true },
        sourceMap: true
      },
      dist: {
        src: ['src/**/*.js'],
        dest: 'dist/<%= pkg.name %>.js'
      }
    },
    uglify: {
      options: {
        banner: '<%= banner %>',
        sourceMap: true
      },
      dist: {
        src: '<%= concat.dist.dest %>',
        dest: 'dist/<%= pkg.name %>.min.js'
      }
    },
    jshint: {
      options: {
        curly: true,
        eqeqeq: true,
        immed: true,
        latedef: false,
        newcap: true,
        noarg: true,
        sub: true,
        undef: true,
        unused: true,
        boss: true,
        eqnull: true,
        browser: true,
        jasmine: true,
        globals: {
          angular: false,
          console: false,
          module: false,
          _: false
        },
        force: true
      },
      gruntfile: {
        src: 'Gruntfile.js'
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-uglify');

  grunt.registerTask('build', ['concat', 'uglify']);
  grunt.registerTask('default', ['jshint', 'build']);
};
