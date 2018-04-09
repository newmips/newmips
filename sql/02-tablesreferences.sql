
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";

USE newmips;

-- --------------------------------------------------------
-- Contenu des tables de références
-- --------------------------------------------------------

--
-- Contenu de la table `role`
--

INSERT INTO `role` (`id`, `name`, `version`) VALUES
(1, 'Administrateur', 1);

--
-- Contenu de la table `user`
--

INSERT INTO `user` (`id`, `email`, `enabled`, `first_name`, `last_name`, `login`, `password`, `phone`, `id_role`, `version`) VALUES
(1, null, 0, 'admin', 'NEWMIPS', 'admin', null, null, 1, 1);