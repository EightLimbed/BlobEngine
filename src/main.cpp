#include <glad/glad.h>
#include <GLFW/glfw3.h>

#include <classes/GLshader.h>

#include <iostream>

void framebuffer_size_callback(GLFWwindow* window, int width, int height);
void processInput(GLFWwindow *window);

// settings
const unsigned int SCR_WIDTH = 800;
const unsigned int SCR_HEIGHT = 600;

int main()
{
    // glfw: initialize and configure
    // ------------------------------
    glfwInit();
    glfwWindowHint(GLFW_CONTEXT_VERSION_MAJOR, 4);
    glfwWindowHint(GLFW_CONTEXT_VERSION_MINOR, 4);
    glfwWindowHint(GLFW_OPENGL_PROFILE, GLFW_OPENGL_CORE_PROFILE);

#ifdef __APPLE__
    glfwWindowHint(GLFW_OPENGL_FORWARD_COMPAT, GL_TRUE);
#endif

    // glfw window creation
    // --------------------
    GLFWwindow* window = glfwCreateWindow(SCR_WIDTH, SCR_HEIGHT, "BlobEngine", NULL, NULL);
    if (window == NULL)
    {
        std::cout << "Failed to create GLFW window" << std::endl;
        glfwTerminate();
        return -1;
    }
    glfwMakeContextCurrent(window);
    glfwSetFramebufferSizeCallback(window, framebuffer_size_callback);

    // glad: load all OpenGL function pointers
    // ---------------------------------------
    if (!gladLoadGLLoader((GLADloadproc)glfwGetProcAddress))
    {
        std::cout << "Failed to initialize GLAD" << std::endl;
        return -1;
    }

    // build and compile shader program
    // ------------------------------------
    Shader ScreenShaders("shaders/3.4.screenquad.vert", "shaders/3.4.raymarcher.frag");
    Shader ComputeShader("shaders/3.4.terrain.comp");

    // vaos need to be bound because of biolerplating shizzle (even if not used)
    GLuint vao;
    glGenVertexArrays(1, &vao);
    glBindVertexArray(vao);

    // temp terrain compute shader, here for testing purposes.
    // Calculate buffer size: 4 bytes for uint + max points * 16 bytes each
    size_t maxPoints = 16 * 16 * 16;
    size_t ssboSize = sizeof(GLuint) + maxPoints * sizeof(float)*4;

    GLuint ssbo;
    glGenBuffers(1, &ssbo);
    glBindBuffer(GL_SHADER_STORAGE_BUFFER, ssbo);
    glBufferData(GL_SHADER_STORAGE_BUFFER, ssboSize, nullptr, GL_DYNAMIC_DRAW);

    GLuint zero = 0;
    glBufferSubData(GL_SHADER_STORAGE_BUFFER, 0, sizeof(GLuint), &zero);

    glBindBufferBase(GL_SHADER_STORAGE_BUFFER, 0, ssbo);

    // bind SSBO to binding point 0 (matches your layout(binding = 0))
    glBindBufferBase(GL_SHADER_STORAGE_BUFFER, 0, ssbo);

    // use compute shader
    ComputeShader.use();

    // empty buffers just in case
    std::vector<GLuint> zeroBuffer(ssboSize / sizeof(GLuint), 0);
    glBufferSubData(GL_SHADER_STORAGE_BUFFER, 0, ssboSize, zeroBuffer.data());

    // Dispatch compute shader threads, based on thread pool size of 64.
    glDispatchCompute(
        (16 + 4 - 1) / 4,
        (16 + 4 - 1) / 4,
        (16 + 4 - 1) / 4
    );
    GLenum err = glGetError();
    if (err != GL_NO_ERROR) {
        std::cout << "OpenGL error after dispatch: " << err << std::endl;
    }

    // make sure writes are visible to fragment stage
    glMemoryBarrier(GL_SHADER_STORAGE_BARRIER_BIT);

    // render loop
    // -----------
    while (!glfwWindowShouldClose(window))
    {
        // input
        // -----
        processInput(window);

        // render
        // ------
        glClearColor(0.2f, 0.2f, 0.2f, 1.0f);
        glClear(GL_COLOR_BUFFER_BIT);
        
        //Compute shaders go here

        // render the triangle
        ScreenShaders.use();
        ScreenShaders.setFloat("iTime", (float)glfwGetTime());
        glDrawArrays(GL_TRIANGLE_STRIP, 0, 4);

        // glfw: swap buffers and poll IO events (keys pressed/released, mouse moved etc.)
        // -------------------------------------------------------------------------------
        glfwSwapBuffers(window);
        glfwPollEvents();
    }

    // glfw: terminate, clearing all previously allocated GLFW resources.
    // ------------------------------------------------------------------
    glfwTerminate();
    return 0;
}

// process all input: query GLFW whether relevant keys are pressed/released this frame and react accordingly
// ---------------------------------------------------------------------------------------------------------
void processInput(GLFWwindow *window)
{
    if (glfwGetKey(window, GLFW_KEY_ESCAPE) == GLFW_PRESS)
        glfwSetWindowShouldClose(window, true);
}

// glfw: whenever the window size changed (by OS or user resize) this callback function executes
// ---------------------------------------------------------------------------------------------
void framebuffer_size_callback(GLFWwindow* window, int width, int height)
{
    // make sure the viewport matches the new window dimensions; note that width and 
    // height will be significantly larger than specified on retina displays.
    glViewport(0, 0, width, height);
}