#ifndef SHADER_H
#define SHADER_H

#include <glad/glad.h>
#include <string>
#include <fstream>
#include <sstream>
#include <iostream>
#include <vector>
#include <utility>

class Shader
{
public:
    unsigned int ID;

    // Constructor: vertex + fragment
    Shader(const char* vertexPath, const char* fragmentPath)
    {
        std::vector<std::pair<GLenum, const char*>> shaders = {
            {GL_VERTEX_SHADER,   vertexPath},
            {GL_FRAGMENT_SHADER, fragmentPath}
        };
        compileAndLink(shaders);
    }

    // Constructor: compute only
    Shader(const char* computePath)
    {
        std::vector<std::pair<GLenum, const char*>> shaders = {
            {GL_COMPUTE_SHADER, computePath}
        };
        compileAndLink(shaders);
    }

    void use() const
    {
        glUseProgram(ID);
    }

    void setBool(const std::string &name, bool value) const
    {
        glUniform1i(glGetUniformLocation(ID, name.c_str()), (int)value);
    }
    void setInt(const std::string &name, int value) const
    {
        glUniform1i(glGetUniformLocation(ID, name.c_str()), value);
    }
    void setFloat(const std::string &name, float value) const
    {
        glUniform1f(glGetUniformLocation(ID, name.c_str()), value);
    }

private:
    std::string loadSourceFromFile(const char* path)
    {
        std::ifstream file;
        file.exceptions(std::ifstream::failbit | std::ifstream::badbit);
        std::stringstream stream;
        try
        {
            file.open(path);
            stream << file.rdbuf();
            file.close();
        }
        catch (std::ifstream::failure& e)
        {
            std::cout << "ERROR::SHADER::FILE_NOT_SUCCESSFULLY_READ: " << path
                      << "\n" << e.what() << std::endl;
        }
        return stream.str();
    }

    void compileAndLink(const std::vector<std::pair<GLenum, const char*>>& shaders)
    {
        std::vector<unsigned int> shaderIDs;

        for (auto& [type, path] : shaders)
        {
            std::string code = loadSourceFromFile(path);
            const char* codeCStr = code.c_str();

            unsigned int shader = glCreateShader(type);
            glShaderSource(shader, 1, &codeCStr, NULL);
            glCompileShader(shader);
            checkCompileErrors(shader, shaderTypeName(type));
            shaderIDs.push_back(shader);
        }

        ID = glCreateProgram();
        for (auto shader : shaderIDs)
            glAttachShader(ID, shader);
        glLinkProgram(ID);
        checkCompileErrors(ID, "PROGRAM");

        for (auto shader : shaderIDs)
            glDeleteShader(shader);
    }

    std::string shaderTypeName(GLenum type)
    {
        switch (type)
        {
            case GL_VERTEX_SHADER: return "VERTEX";
            case GL_FRAGMENT_SHADER: return "FRAGMENT";
            case GL_COMPUTE_SHADER: return "COMPUTE";
            default: return "UNKNOWN";
        }
    }

    void checkCompileErrors(unsigned int shader, const std::string& type)
    {
        int success;
        char infoLog[1024];
        if (type != "PROGRAM")
        {
            glGetShaderiv(shader, GL_COMPILE_STATUS, &success);
            if (!success)
            {
                glGetShaderInfoLog(shader, 1024, NULL, infoLog);
                std::cout << "ERROR::SHADER_COMPILATION_ERROR of type: " 
                          << type << "\n" << infoLog
                          << "\n -- --------------------------------------------------- -- "
                          << std::endl;
            }
        }
        else
        {
            glGetProgramiv(shader, GL_LINK_STATUS, &success);
            if (!success)
            {
                glGetProgramInfoLog(shader, 1024, NULL, infoLog);
                std::cout << "ERROR::PROGRAM_LINKING_ERROR\n" << infoLog
                          << "\n -- --------------------------------------------------- -- "
                          << std::endl;
            }
        }
    }
};

#endif